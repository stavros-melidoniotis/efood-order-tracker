// Enable the badge when Chrome starts and an order exists in storage
chrome.runtime.onStartup.addListener(() => {
    fetchOrderFromStorage()
        .then((response) => {
            if (response.order) enableBadge();
        })
        .catch((err) => {
            console.error(err);
        });
});

// Inject JS scripts on efood thank-you and orders pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const efoodThankYouPageRegex = /^(https?:\/\/www\.e-food\.gr\/orders\/thankyou\?order_id=[\d]+&user_address=[\d]+(&[\w\d_\-=\.]{0,255}){0,10})$/i;
    const efoodOrdersPageRegex = /^(https?:\/\/www\.e-food\.gr\/account\/orders(\?[\w\d_\-=\.]{0,255}){0,10})$/i;

    if (changeInfo.status === 'complete') {
        if (efoodThankYouPageRegex.test(tab.url)) {
            chrome.scripting.insertCSS({
                target: {
                    tabId: tabId
                },
                files: [
                    "./order-tracking/foreground.css"
                ]
            })
            .then(() => {
                console.log('Injected order-tracking foreground.css style');

                chrome.scripting.executeScript({
                    target: {
                        tabId: tabId
                    },
                    files: [
                        "./order-tracking/foreground.js"
                    ]
                })
                .then(() => {
                    console.log('Injected order-tracking foreground.js script');
                })
            })
            .catch(err => console.log(err));
        }

        if (efoodOrdersPageRegex.test(tab.url)) {
            chrome.scripting.insertCSS({
                target: {
                    tabId: tabId
                },
                files: [
                    "./order-analytics/foreground.css"
                ]
            })
            .then(() => {
                console.log('Injected order-analytics foreground.css style');

                chrome.scripting.executeScript({
                    target: {
                        tabId: tabId
                    },
                    files: [
                        "./order-analytics/foreground.js"
                    ]
                })
                .then(() => {
                    console.log('Injected order-analytics foreground.js script');
                })
            })
            .catch(err => console.log(err));
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'get_order_data') {
        fetchOrderFromStorage()
            .then((orderData) => {
                sendResponse({
                    message: 'success',
                    payload: orderData
                });
            }).catch(() => {
                sendResponse({ message: 'fail' });
            });

        return true;
    }

    if (request.message === 'save_order_data') {
        fetchOrderFromStorage()
            .then((response) => {
                console.log(response)

                if (response.order) {
                    // Save the order only if previous order's ID is different
                    (response.order.order_id !== request.payload.order_id) ?
                        saveOrderToStorage(request, sendResponse) :
                        console.log('Order exists in storage. Skipping save.');
                } else {
                    saveOrderToStorage(request, sendResponse);
                }
            }).catch(() => {
                console.error('Something went wrong! Rejecting promise.');
            });

        return true;
    }

    if (request.message === 'delete_order_data') {
        chrome.storage.sync.remove("order", () => {
            if (chrome.runtime.lastError) {
                sendResponse({ message: 'fail' });
        
                return;
            };
    
            sendResponse({ message: 'success' });
            disableBadge();
            console.log('Order deleted from storage!');
        });

        return true;
    }
});

async function fetchOrderFromStorage() {
    let promise = new Promise((resolve, reject) => {
        chrome.storage.sync.get("order", data => {
            if (chrome.runtime.lastError) { reject('Failed'); };

            resolve(data);
        });
    });

    return promise;
};

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
            store_telephone: request.payload.store_telephone
        }
    }, () => {
        if (chrome.runtime.lastError) {
            sendResponse({ message: 'fail' });
    
            return;
        };

        sendResponse({ message: 'success' });
        enableBadge();
        console.log('Order saved in storage!');
    });
}

function enableBadge() {
    chrome.action.setBadgeBackgroundColor({color:'#ED2E2E'});
    chrome.action.setBadgeText({text:"1"});
}

function disableBadge() {
    chrome.action.setBadgeBackgroundColor({color:'#ED2E2E'});
    chrome.action.setBadgeText({text:""});
}