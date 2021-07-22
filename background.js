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

// Inject the foreground.js script on efood thank-you order page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    let efoodUrlRegex = /^(https?:\/\/www\.e-food\.gr\/orders\/thankyou\?order_id=[\d]+&user_address=[\d]+)$/i;

    if (changeInfo.status === 'complete' && efoodUrlRegex.test(tab.url)) {
        chrome.scripting.executeScript({
            target: {
                tabId: tabId
            },
            files: [
                "./foreground.js"
            ]
        })
        .then(() => {
            console.log('Injected foreground.js script');
        })
        .catch(err => console.log(err));
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
        chrome.storage.local.remove("order", () => {
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
        chrome.storage.local.get("order", data => {
            if (chrome.runtime.lastError) { reject('Failed'); };

            resolve(data);
        });
    });

    return promise;
};

function saveOrderToStorage(request, sendResponse) {
    chrome.storage.local.set({
        order: {
            order_id: request.payload.order_id,
            order_datetime: request.payload.order_datetime,
            waiting_time: request.payload.waiting_time,
            estimated_arrival: request.payload.estimated_arrival,
            store_logo_url: request.payload.store_logo_url,
            store_name: request.payload.store_name,
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