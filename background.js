// chrome.runtime.onInstalled.addListener(() => {
//     chrome.storage.local.set({ 
//         order: {
//             waiting_time: '50',
//             estimated_arrival: '00:00',
//             store_telephone: '2892053322'
//         }
//     });
// });

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
            console.log('injected fg script');
        })
        .catch(err => console.log(err));
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.message === 'get_order_data') {
        chrome.storage.local.get('order', data => {
            if (chrome.runtime.lastError) {
                sendResponse({
                    message: 'fail'
                });
        
                return;
            };

            sendResponse({
                message: 'success',
                payload: data
            })
        });

        return true;
    }

    if (request.message === 'save_order_data') {
        chrome.storage.local.set({
            order: {
                waiting_time: request.payload.waiting_time,
                estimated_arrival: request.payload.estimated_arrival,
                store_telephone: request.payload.store_telephone
            }
        }, () => {
            if (chrome.runtime.lastError) {
                sendResponse({ message: 'fail' });
        
                return;
            };

            sendResponse({ message: 'success' });
        });

        return true;
    }
});