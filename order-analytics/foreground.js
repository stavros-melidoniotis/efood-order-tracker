const mainDocument = document
const ordersContainer = document.querySelector("#main-container > main > section.position-relative > div > div")

const analyticsButton = document.createElement('button')
analyticsButton.setAttribute('id', 'analytics-button')
analyticsButton.innerHTML = 'Analytics 📈'

ordersContainer.appendChild(analyticsButton)

analyticsButton.addEventListener('click', () => {
    let analyticsSidebar = mainDocument.querySelector('#analytics-sidebar')

    if (analyticsSidebar) {
        analyticsSidebar.classList.toggle('collapsed')
        return
    }

    const ordersLimit = 100_000
    const url = `https://www.e-food.gr/account/get_past_orders?limit=${ordersLimit}`

    fetchOrders(url)
})

mainDocument.addEventListener('click', (e) => {
    let analyticsSidebar = mainDocument.querySelector('#analytics-sidebar')
    let analyticsSidebarToggler = mainDocument.querySelector('#analytics-sidebar-toggler')

    if (!analyticsSidebar) {
        return
    }

    if (analyticsSidebar.contains(e.target) || e.target === analyticsButton || e.target === analyticsSidebarToggler) {
        return
    }

    analyticsSidebar.classList.add('collapsed')
})

async function fetchOrders(url) {
    analyticsButton.innerHTML = 'Φόρτωση <p id="loading-img"> ⌛ </p>'
    let response = await fetch(url)
    analyticsButton.innerHTML = 'Analytics 📈'

    if (response.status === 200) {
        const data = await response.text()
        const document = new DOMParser().parseFromString(data, 'text/html')
        // const body = document.body

        // console.log(body);

        const orders = document.querySelectorAll("body > li")

        const totalOrders = orders.length
        let totalExpenses = 0
        let piniatasCounter = 0
        let totalPiniataDiscount = 0
        let paidWithCashCounter = 0
        let paidWithCardCounter = 0
        let paidWithPaypalCounter = 0
        let restaurants = []
        let ordersPerDay = [
            {day: 'Κυριακή', orders_count: 0},
            {day: 'Δευτέρα', orders_count: 0},
            {day: 'Τρίτη', orders_count: 0},
            {day: 'Τετάρτη', orders_count: 0},
            {day: 'Πέμπτη', orders_count: 0},
            {day: 'Παρασκευή', orders_count: 0},
            {day: 'Σάββατο', orders_count: 0}
        ]

        let ordersPerTimeRange = [
            {hour_range: 'πριν τις 12:00', orders_count: 0},
            {hour_range: '12:00 - 16:00', orders_count: 0},
            {hour_range: '16:00 - 20:00', orders_count: 0},
            {hour_range: 'μετά τις 20:00', orders_count: 0}
        ]

        orders.forEach(order => {
            let orderAmount = getAmount(order)
            let dayOfOrder = getDayOfOrder(order)
            let timeRange = getTimeRange(order)
            let paymentMethod = getPaymentMethod(order)

            switch (paymentMethod) {
                case 'cash':
                    paidWithCashCounter++
                    break
                case 'card':
                    paidWithCardCounter++
                    break
                case 'paypal':
                    paidWithPaypalCounter++
                    break
            }

            ordersPerDay[dayOfOrder].orders_count++
            ordersPerTimeRange[timeRange].orders_count++
            totalExpenses += orderAmount

            if (hasPiniataDiscount(order)) {
                piniatasCounter++
                totalPiniataDiscount += calculatePiniataDiscount(orderAmount)
            }

            let orderRestaurant = getRestaurant(order)
            let restaurantName = orderRestaurant.getAttribute('alt')
            let restaurantLogo = orderRestaurant.dataset.src
            let restaurantURL = getRestaurantURL(orderRestaurant)

            restaurants.push([restaurantName, restaurantLogo, restaurantURL])
        })

        let favoriteRestaurants = findFavoriteRestaurants(restaurants, orders)

        // Sort favorite restaurants by number of orders
        favoriteRestaurants = favoriteRestaurants.sort((a, b) => b.times_ordered - a.times_ordered)
        favoriteRestaurants = favoriteRestaurants.slice(0, 5)

        const stats = [
            totalOrders,
            totalExpenses,
            piniatasCounter,
            totalPiniataDiscount,
            paidWithCashCounter,
            paidWithCardCounter,
            paidWithPaypalCounter,
            favoriteRestaurants, 
            ordersPerDay, 
            ordersPerTimeRange, 
        ]

        const sidebar = document.createElement('div')
        const sidebarContent = document.createElement('div')
        const sidebarToggler = document.createElement('button')

        sidebar.setAttribute('id', 'analytics-sidebar')

        sidebarContent.setAttribute('id', 'analytics-sidebar-content')
        fillWithStats(sidebarContent, stats)

        sidebarToggler.setAttribute('id', 'analytics-sidebar-toggler')
        sidebarToggler.classList.add('btn')
        sidebarToggler.innerHTML = 'Αποτελέσματα'

        if (!mainDocument.querySelector('#analytics-sidebar')) {
            mainDocument.body.appendChild(sidebar)
            sidebar.appendChild(sidebarToggler)
            sidebar.appendChild(sidebarContent)
        }

        sidebarToggler.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed')
        })
    } else {
        console.error('Something went wrong. Please try again later');
    }
}

function getAmount(order) {
    let amount = order.querySelector('div > div:nth-child(5) > div').innerText

    amount = cleanOrderAmount(amount)
    amount = parseFloat(amount)

    return amount
}

function cleanOrderAmount(amount) {
    return amount.replace(',', '.').replace('€', '')
}

function getDayOfOrder(order) {
    let orderDate = order.querySelector('div > div:nth-child(2) > strong').innerText
    let orderDateParts = orderDate.split('/')
    let formattedDate = `${orderDateParts[1]}/${orderDateParts[0]}/${orderDateParts[2]}`
    let day = new Date(formattedDate).getDay()

    return day
}

function getTimeRange(order) {
    let time = order.querySelector('div > div:nth-child(2) > div > em').innerText
    let timeParts = time.split(':')
    let hour = timeParts[0]

    if (hour <= 12) {
        return 0
    }

    if (hour > 12 && hour <= 16) {
        return 1
    }

    if (hour > 16 && hour <= 20) {
        return 2
    }

    return 3
}

function getPaymentMethod(order) {
    let paymentMethod = order.querySelector('div > div:nth-child(5) > span > i')

    if (!paymentMethod) {
        return 'cash'
    }

    return (paymentMethod.classList.contains('fa-credit-card')) ? 'card' : 'paypal'
}

function hasPiniataDiscount(order) {
    const PINIATA_TEXT = 'Έκπτωση Τυχερής Πεινιάτας'
    const lastItem = order.querySelector('div > div:nth-child(4) > div:last-of-type').innerText

    return lastItem.includes(PINIATA_TEXT)
}

function calculatePiniataDiscount(amount) {
    const SMALL_PINIATA_DISCOUNT = 5
    const MEDIUM_PINIATA_DISCOUNT = 7
    const BIG_PINIATA_DISCOUNT = 10

    if (amount < 13 ) {
        return SMALL_PINIATA_DISCOUNT
    }

    if (amount < 20 && amount >= 13) {
        return MEDIUM_PINIATA_DISCOUNT
    }

    return BIG_PINIATA_DISCOUNT
}

function getRestaurant(order, nameOnly = false) {
    return (nameOnly) ? 
        order.querySelector('div > div:nth-child(3) > div > img').getAttribute('alt') :
        order.querySelector('div > div:nth-child(3) > div > img')
}

function getRestaurantURL(restaurant) {
    let restaurantLogoURL = restaurant.dataset.src
    let restaurantID = restaurantLogoURL.split('/')[4]

    return `https://www.e-food.gr/menu?shop_id=${restaurantID}`
}

function findFavoriteRestaurants(restaurants, orders) {
    let restaurantsWithCounter = [];

    restaurants.forEach(restaurant => {
        let restaurantName = restaurant[0]
        let restaurantLogo = restaurant[1]
        let restaurantURL = restaurant[2]

        if (!restaurantsWithCounter.find(elem => elem.name === restaurantName)) {
            let timesOrdered = restaurants.filter(elem => elem[0] === restaurantName).length
            let restaurantExpenses = getExpensesPerRestaurant(orders, restaurantName)

            restaurantsWithCounter.push({
                name: restaurantName, 
                times_ordered: timesOrdered, 
                total_expenses: restaurantExpenses.toFixed(2), 
                logo: restaurantLogo,
                url: restaurantURL
            })
        }
    })

    return restaurantsWithCounter;
}

function getExpensesPerRestaurant(orders, restaurant) {
    let restaurantExpenses = 0

    orders.forEach(order => {
        if (restaurant === getRestaurant(order, true)) {
            restaurantExpenses += getAmount(order)
        }
    })

    return restaurantExpenses
}

function fillWithStats(sidebarContent, stats) {
    let totalOrders = stats[0]
    let totalExpenses = stats[1]
    let piniatasCounter = stats[2]
    let totalPiniataDiscount = stats[3]
    let paidWithCashCounter = stats[4]
    let paidWithCardCounter = stats[5]
    let paidWithPaypalCounter = stats[6]
    let favoriteRestaurants = stats[7]
    let ordersPerDay = stats[8]
    let ordersPerTimeRange = stats[9]

    let topRestaurantsHTML = ''
    let ordersPerDayHTML = ''
    let ordersPerTimeRangeHTML = ''

    favoriteRestaurants.forEach(restaurant => {
        topRestaurantsHTML += `
            <li class="top-restaurants-item">
                <a href="${restaurant.url}" target="_blank" title="Παράγγειλε ξανά από: ${restaurant.name}">
                    <img src="${restaurant.logo}" alt="${restaurant.name}">
                </a>
                <div>
                    <a href="${restaurant.url}" target="_blank" title="Παράγγειλε ξανά από: ${restaurant.name}">
                        <h3> ${restaurant.name} </h3>
                    </a>
                    <p> Έχεις παραγγείλει <b> ${restaurant.times_ordered} </b> φορές </p> 
                    <p> Συνολικές δαπάνες <b> ${restaurant.total_expenses} € </b> </p> 
                </div>
            </li>
        `
    })

    ordersPerDay.forEach(item => {
        ordersPerDayHTML += `
            <li class="orders-per-day-item">
                <h3> ${item.day} </h3>
                <span>(<i>${item.orders_count} παραγγελίες</i>)</span>
            </li>
        `
    })

    ordersPerTimeRange.forEach(item => {
        ordersPerTimeRangeHTML += `
            <li class="orders-per-time-range-item">
                <h3> ${item.hour_range} </h3>
                <span>(<i>${item.orders_count} παραγγελίες</i>)</span>
            </li>
        `
    })

    let html = `
        <h1> Ενδιαφέροντα στοιχεία για τις παραγγελίες σου στο <br> e-food </h1>
        <div class="top-restaurants">
            <h2> Τα top 5 μαγαζιά 🍽️ </h2>
            <span class="mb-5"> Βάση συχνότητας παραγγελιών </span>
            <ul> ${topRestaurantsHTML} </ul>
        </div>

        <div class="orders-per-day">
            <h2 class="mb-5"> Ποιες μέρες παραγγέλνεις πιο συχνά 📆 </h2>
            <ul> ${ordersPerDayHTML} </ul>
        </div>

        <div class="orders-per-time-range">
            <h2 class="mb-5"> Ποιες ώρες παραγγέλνεις πιο συχνά 🕖 </h2>
            <ul> ${ordersPerTimeRangeHTML} </ul>
        </div>

        <h2 class="mb-5"> Σε αριθμούς 📈 </h2>
        <hr>
        <div class="analytics-container">
            <div class="counter-box"> <h2> ${totalOrders} </h2> </div>
            <h2> Συνολικές παραγγελίες </h2>
        </div>
        <hr>
        <div class="analytics-container">
            <div class="counter-box"> <h2> ${totalExpenses.toFixed(0)} € </h2> </div>
            <h2> Συνολικά έξοδα </h2>
        </div>
        <hr>
        <div class="analytics-container">
            <div class="counter-box"> <h2> ${piniatasCounter} </h2> </div>
            <h2> Παραγγελίες με πινιάτες </h2>
        </div>
        <hr>
        <div class="analytics-container">
            <div class="counter-box"> <h2> -${totalPiniataDiscount} € </h2> </div>
            <h2> Έκπτωση από πινιάτες </h2>
        </div>
        <hr>
        <div class="analytics-container">
            <div class="counter-box"> <h2> ${paidWithCardCounter} </h2> </div>
            <h2> Πληρωμές με κάρτα </h2>
        </div>
        <hr>
        <div class="analytics-container">
            <div class="counter-box"> <h2> ${paidWithCashCounter} </h2> </div>
            <h2> Πληρωμές με μετρητά </h2>
        </div>
        <hr>
        <div class="analytics-container">
            <div class="counter-box"> <h2> ${paidWithPaypalCounter} </h2> </div>
            <h2> Πληρωμές με paypal </h2>
        </div>
        <hr>
    `

    return sidebarContent.insertAdjacentHTML('beforeend', html)
}