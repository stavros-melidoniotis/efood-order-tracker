// Enable the badge when Chrome starts and an order exists in storage
chrome.runtime.onStartup.addListener(async () => {
    try {
        const { order } = await fetchOrderFromStorage()
        order && enableBadge()
    } catch (err) {
        console.error(err)
    }
})

const thankYouPageActions = async tabId => {
    try {
        await chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ["./order-tracking/foreground.css"]
        })

        console.log('Injected order-tracking foreground.css style')

        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./order-tracking/foreground.js"]
        })

        console.log('Injected order-tracking foreground.js script')
    } catch (err) {
        console.error(err)
    }
}

const ordersPageActions = async tabId => {
    try {
        await chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ["./order-analytics/foreground.css"]
        })

        console.log('Injected order-analytics foreground.css style')

        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./order-analytics/foreground.js"]
        })

        console.log('Injected order-analytics foreground.js script')

        const cookie = await chrome.cookies.get({
            name: 'sparks-sid',
            url: 'https://www.e-food.gr/'
        })

        chrome.tabs.sendMessage(tabId, {
            message: 'cookie-value',
            payload: cookie.value
        }, response => console.log('Order analytics foreground.js received the cookie value'))
    } catch (err) {
        console.error(err)
    }
}

// Inject JS scripts on efood thank-you and orders pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const efoodThankYouPageRegex = /^(https?:\/\/www\.e-food\.gr\/orders\/thankyou\?order_id=[\d]+(&[\w\d_\-=\.]{0,255}){0,10})$/i
    const efoodOrdersPageRegex = /^(https?:\/\/www\.e-food\.gr\/account\/orders(\?[\w\d_\-=\.]{0,255}){0,10})$/i

    if (changeInfo.status === 'complete') {
        if (efoodThankYouPageRegex.test(tab.url)) {
            thankYouPageActions(tabId)
        }

        if (efoodOrdersPageRegex.test(tab.url)) {
            ordersPageActions(tabId)
        }
    }
})

const handleGetOrderDataRequest = async (sendResponse) => {
    try {
        const { order } = await fetchOrderFromStorage()

        sendResponse({
            message: 'success',
            payload: order
        })
    } catch (err) {
        await sendResponse({ message: 'fail' })
    }
}

const handleSaveOrderDataRequest = async (request, sendResponse) => {
    try {
        const { order } = await fetchOrderFromStorage()

        if (!order || order.order_id !== request.payload.order_id) {
            saveOrderToStorage(request, sendResponse)
            return
        }

        console.log('Order exists in storage. Skipping save.')
    } catch (err) {
        console.error('Something went wrong! Rejecting promise.')
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'get_order_data') {
        handleGetOrderDataRequest(sendResponse)
        return true
    }

    if (request.message === 'save_order_data') {
        handleSaveOrderDataRequest(request, sendResponse)
        return true
    }

    if (request.message === 'delete_order_data') {
        chrome.storage.sync.remove("order", () => {
            if (chrome.runtime.lastError) {
                sendResponse({ message: 'fail' })
                return
            }

            sendResponse({ message: 'success' })
            disableBadge()
            console.log('Order deleted from storage!')
        })

        return true
    }
})

async function fetchOrderFromStorage() {
    let promise = new Promise((resolve, reject) => {
        chrome.storage.sync.get("order", data => {
            if (chrome.runtime.lastError) { reject('Failed') }

            resolve(data)
        })
    })

    return promise
}

function saveOrderToStorage(request, sendResponse) {
    chrome.storage.sync.set({
        order: {
            order_id: request.payload.order_id,
            order_datetime: request.payload.order_datetime,
            waiting_time: request.payload.waiting_time,
            estimated_arrival: request.payload.estimated_arrival,
            store_logo_url: request.payload.store_logo_url,
            store_name: request.payload.store_name,
            order_total: request.payload.order_total,
            store_telephone: request.payload.store_telephone,
            order_items: request.payload.order_items
        }
    }, () => {
        if (chrome.runtime.lastError) {
            sendResponse({ message: 'fail' })

            return
        }

        sendResponse({ message: 'success' })
        enableBadge()
        console.log('Order saved in storage!')
    })
}

function enableBadge() {
    chrome.action.setBadgeBackgroundColor({ color: '#ED2E2E' })
    chrome.action.setBadgeText({ text: "1" })
}

function disableBadge() {
    chrome.action.setBadgeBackgroundColor({ color: '#ED2E2E' })
    chrome.action.setBadgeText({ text: "" })
}