const ordersContainer = document.querySelector("#main-container > main > section.position-relative > div > div")

const analyticsButton = document.createElement('button')
analyticsButton.setAttribute('id', 'analytics-button')
analyticsButton.innerHTML = 'Analytics'

ordersContainer.appendChild(analyticsButton)

analyticsButton.addEventListener('click', () => {
    const ordersLimit = 100_000
    const url = `https://www.e-food.gr/account/get_past_orders?limit=${ordersLimit}`

    fetchOrders(url)
})

async function fetchOrders(url) {
    let response = await fetch(url)

    if (response.status === 200) {
        const data = await response.text()
        const document = new DOMParser().parseFromString(data, 'text/html')
        const body = document.body

        console.log(body);

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
            {hour_range: '< 12:00', orders_count: 0},
            {hour_range: '12:00 - 16:00', orders_count: 0},
            {hour_range: '16:00 - 20:00', orders_count: 0},
            {hour_range: '> 20:00', orders_count: 0}
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

            restaurants.push([restaurantName, restaurantLogo])
        })

        let favoriteRestaurants = findFavoriteRestaurants(restaurants, orders)

        // Sort favorite restaurants by number of orders
        favoriteRestaurants = favoriteRestaurants.sort((a, b) => b.times_ordered - a.times_ordered)
        favoriteRestaurants = favoriteRestaurants.slice(0, 5)

        console.log(favoriteRestaurants);
        console.log(ordersPerDay);
        console.log(ordersPerTimeRange);

        console.log(`Total orders: ${totalOrders}`);
        console.log(`Total expenses: ${totalExpenses.toFixed(2)}`);

        console.log(`Total piniatas: ${piniatasCounter}`);
        console.log(`Total piniatas discount: ${totalPiniataDiscount}`);

        console.log(`Times paid with card: ${paidWithCardCounter}`);
        console.log(`Times paid with cash: ${paidWithCashCounter}`);
        console.log(`Times paid with paypal: ${paidWithPaypalCounter}`);
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

function findFavoriteRestaurants(restaurants, orders) {
    let restaurantsWithCounter = [];

    restaurants.forEach(restaurant => {
        let restaurantName = restaurant[0]
        let restaurantLogo = restaurant[1]

        if (!restaurantsWithCounter.find(elem => elem.name === restaurantName)) {
            let timesOrdered = restaurants.filter(elem => elem[0] === restaurantName).length
            let restaurantExpenses = getExpensesPerRestaurant(orders, restaurantName)

            restaurantsWithCounter.push({
                name: restaurantName, 
                times_ordered: timesOrdered, 
                total_expenses: restaurantExpenses.toFixed(2), 
                logo: restaurantLogo
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

