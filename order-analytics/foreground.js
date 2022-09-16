cookieValue = null

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'cookie-value') {
        cookieValue = request.payload

        sendResponse({ message: 'success' })
    }
})

const analyticsButton = document.createElement('button')
analyticsButton.setAttribute('id', 'analytics-button')
analyticsButton.innerHTML = 'Analytics 📈'

document.body.appendChild(analyticsButton)

analyticsButton.addEventListener('click', () => {
    const analyticsSidebar = document.querySelector('#analytics-sidebar')

    if (analyticsSidebar) {
        analyticsSidebar.classList.toggle('collapsed')
        return
    }

    const ordersLimit = 100_000
    const url = `https://api.e-food.gr/api/v1/user/orders/history?limit=${ordersLimit}&mode=extended`

    fetchOrders(url)
})

document.addEventListener('click', (e) => {
    const analyticsSidebar = document.querySelector('#analytics-sidebar')
    const analyticsSidebarToggler = document.querySelector('#analytics-sidebar-toggler')

    if (!analyticsSidebar) {
        return
    }

    if (analyticsSidebar.contains(e.target) || e.target === analyticsButton || e.target === analyticsSidebarToggler) {
        return
    }

    analyticsSidebar.classList.add('collapsed')
})

async function fetchOrders(url) {
    analyticsButton.innerHTML = 'Φόρτωση <span id="loading-img"> ⌛ </span>'

    const response = await fetch(url, {
        headers: { 'x-core-session-id': cookieValue }
    })

    analyticsButton.innerHTML = 'Analytics 📈'

    if (response.status !== 200) {
        console.error('Something went wrong. Please try again later')
        return
    }

    const json = await response.json()
    const orders = json.data.orders
    const totalOrders = orders.length

    let totalExpenses = 0
    // let piniatasCounter = 0
    // let totalPiniataDiscount = 0
    let paidWithCashCounter = 0
    let paidWithCardCounter = 0
    let paidWithPaypalCounter = 0

    const restaurants = []
    const ordersPerDay = [
        { day: 'Κυριακή', orders_count: 0 },
        { day: 'Δευτέρα', orders_count: 0 },
        { day: 'Τρίτη', orders_count: 0 },
        { day: 'Τετάρτη', orders_count: 0 },
        { day: 'Πέμπτη', orders_count: 0 },
        { day: 'Παρασκευή', orders_count: 0 },
        { day: 'Σάββατο', orders_count: 0 }
    ]
    const ordersPerTimeRange = [
        { hour_range: 'πριν τις 12:00', orders_count: 0 },
        { hour_range: '12:00 - 16:00', orders_count: 0 },
        { hour_range: '16:00 - 20:00', orders_count: 0 },
        { hour_range: 'μετά τις 20:00', orders_count: 0 }
    ]

    for (const order of orders) {
        const { dayOfOrder, timeRange } = getDayAndTimeOfOrder(order)
        const { name, logo, id } = order.restaurant

        ordersPerDay[dayOfOrder].orders_count++
        ordersPerTimeRange[timeRange].orders_count++
        totalExpenses += order.price

        restaurants.push([name, logo, `https://www.e-food.gr/menu?shop_id=${id}`])

        switch (order.payment_type) {
            case 'cash':
                paidWithCashCounter++
                break
            case 'credit_card':
                paidWithCardCounter++
                break
            case 'paypal':
                paidWithPaypalCounter++
                break
        }

        // if (hasPiniataDiscount(order)) {
        //     piniatasCounter++
        //     totalPiniataDiscount += calculatePiniataDiscount(orderAmount)
        // }
    }

    // Top 5 restaurant sorted by number of orders
    const favoriteRestaurants =
        findFavoriteRestaurants(restaurants, orders)
            .sort((a, b) => b.times_ordered - a.times_ordered)
            .slice(0, 5)

    const stats = {
        total_orders: totalOrders,
        total_expenses: totalExpenses,
        // piniatasCounter,
        // totalPiniataDiscount,
        cash_counter: paidWithCashCounter,
        card_counter: paidWithCardCounter,
        paypal_counter: paidWithPaypalCounter,
        favorite_restaurants: favoriteRestaurants,
        orders_per_day: ordersPerDay,
        orders_per_timerange: ordersPerTimeRange,
    }

    const sidebar = document.createElement('div')
    const sidebarContent = document.createElement('div')
    const sidebarToggler = document.createElement('button')

    sidebar.setAttribute('id', 'analytics-sidebar')
    sidebarContent.setAttribute('id', 'analytics-sidebar-content')
    sidebarToggler.setAttribute('id', 'analytics-sidebar-toggler')
    sidebarToggler.classList.add('btn')
    sidebarToggler.innerHTML = 'Αποτελέσματα'

    fillWithStats(sidebarContent, stats)

    if (!document.querySelector('#analytics-sidebar')) {
        document.body.appendChild(sidebar)
        sidebar.appendChild(sidebarToggler)
        sidebar.appendChild(sidebarContent)
    }

    sidebarToggler.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed')
    })
}

function getDayAndTimeOfOrder(order) {
    const submissionDate = order.submission_date
    const [date, time] = submissionDate.split(' ')
    const hour = time.split(':')[0]

    let timeRangeIndex = 3

    if (hour <= 12) {
        timeRangeIndex = 0
    }

    if (hour > 12 && hour <= 16) {
        timeRangeIndex = 1
    }

    if (hour > 16 && hour <= 20) {
        timeRangeIndex = 2
    }

    return {
        dayOfOrder: new Date(date).getDay(),
        timeRange: timeRangeIndex
    }
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

    if (amount < 13) {
        return SMALL_PINIATA_DISCOUNT
    }

    if (amount < 20 && amount >= 13) {
        return MEDIUM_PINIATA_DISCOUNT
    }

    return BIG_PINIATA_DISCOUNT
}

function findFavoriteRestaurants(restaurants, orders) {
    const restaurantsWithCounter = [];

    for (const restaurant of restaurants) {
        const [restaurantName, restaurantLogo, restaurantURL] = restaurant

        if (!restaurantsWithCounter.find(restaurant => restaurant.name === restaurantName)) {
            const timesOrdered = restaurants.filter(restaurant => restaurant[0] === restaurantName).length
            const restaurantExpenses = getExpensesPerRestaurant(orders, restaurantName)

            restaurantsWithCounter.push({
                name: restaurantName,
                times_ordered: timesOrdered,
                total_expenses: restaurantExpenses.toFixed(2),
                logo: restaurantLogo,
                url: restaurantURL
            })
        }
    }

    return restaurantsWithCounter;
}

function getExpensesPerRestaurant(orders, restaurant) {
    let restaurantExpenses = 0

    for (const order of orders) {
        if (restaurant === order.restaurant.name) {
            restaurantExpenses += order.price
        }
    }

    return restaurantExpenses
}

function fillWithStats(sidebarContent, stats) {
    const {
        total_orders,
        total_expenses,
        cash_counter,
        card_counter,
        paypal_counter,
        favorite_restaurants,
        orders_per_day,
        orders_per_timerange
    } = stats

    let topRestaurantsHTML = ''
    let ordersPerDayHTML = ''
    let ordersPerTimeRangeHTML = ''

    for (const restaurant of favorite_restaurants) {
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
            </li>`
    }

    for (const item of orders_per_day) {
        ordersPerDayHTML += `
            <li class="orders-per-day-item">
                <h3> ${item.day} </h3>
                <span>(<i>${item.orders_count} παραγγελίες</i>)</span>
            </li>`
    }

    for (const item of orders_per_timerange) {
        ordersPerTimeRangeHTML += `
            <li class="orders-per-time-range-item">
                <h3> ${item.hour_range} </h3>
                <span>(<i>${item.orders_count} παραγγελίες</i>)</span>
            </li>`
    }

    const html = `
        <h1> Ενδιαφέροντα στοιχεία για τις παραγγελίες σου στο e-food </h1>
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
            <div class="counter-box"> <h2> ${total_orders} </h2> </div>
            <h2> Συνολικές παραγγελίες </h2>
        </div>
        <hr>
        <div class="analytics-container">
            <div class="counter-box"> <h2> ${total_expenses.toFixed(0)} € </h2> </div>
            <h2> Συνολικά έξοδα </h2>
        </div>
        <hr>

        

        <div class="analytics-container">
            <div class="counter-box"> <h2> ${card_counter} </h2> </div>
            <h2> Πληρωμές με κάρτα </h2>
        </div>
        <hr>
        <div class="analytics-container">
            <div class="counter-box"> <h2> ${cash_counter} </h2> </div>
            <h2> Πληρωμές με μετρητά </h2>
        </div>
        <hr>
        <div class="analytics-container">
            <div class="counter-box"> <h2> ${paypal_counter} </h2> </div>
            <h2> Πληρωμές με paypal </h2>
        </div>
        <hr>
    `

    return sidebarContent.insertAdjacentHTML('beforeend', html)

    // <!--
    //     <div class="analytics-container">
    //         <div class="counter-box"> <h2> ${piniatasCounter ?? ''} </h2> </div>
    //         <h2> Παραγγελίες με πινιάτες </h2>
    //     </div> 
    //     <hr>
    //     <div class="analytics-container">
    //         <div class="counter-box"> <h2> -${totalPiniataDiscount ?? ''} € </h2> </div>
    //         <h2> Έκπτωση από πινιάτες </h2>
    //     </div>
    //     <hr>

    //     --></hr>
}