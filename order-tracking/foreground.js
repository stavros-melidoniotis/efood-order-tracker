const injectEfoodTracker = () => {
    let waitingTime = document.querySelector("#thankyou-page > div > div > div > div > div > div > div > div > div > div:nth-child(2)").textContent
    const waitingTimeParts = waitingTime.split(' ')

    waitingTime = waitingTimeParts[waitingTimeParts.length - 1]

    const storeLogoUrl = document.querySelector("#thankyou-page > div > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(3) > div:nth-child(1) > img").getAttribute('src')
    const storeName = document.querySelector("#thankyou-page > div > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(3) > div:nth-child(1) > div > div").textContent
    const orderTotal = document.querySelector("#thankyou-page > div > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(3) > div:nth-child(3) > div > div").textContent
    const storeTelephone = document.querySelector("#thankyou-page > div > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > a > span").textContent
    
    // Remove minutes symbol from time
    waitingTime = waitingTime.replace("'", "")
    
    const currentDate = new Date().getTime()
    const estimatedArrivalTime = new Date(currentDate + waitingTime * 60000).getTime()
    
    const urlString = window.location.href
    const url = new URL(urlString)
    const orderID = url.searchParams.get("order_id")
    
    chrome.runtime.sendMessage({
        message: 'save_order_data',
        payload: {
            order_id: orderID,
            order_datetime: currentDate,
            waiting_time: waitingTime,
            estimated_arrival: estimatedArrivalTime,
            store_logo_url: storeLogoUrl,
            store_name: storeName,
            order_total: orderTotal,
            store_telephone: storeTelephone
        }
    }, response => {
        if (response.message === 'success') {
            console.log('New order data saved!');
    
            let popup = document.createElement('div');
            popup.id = 'popup';
            popup.innerHTML = '<p> <span>Επιτυχής </span> προσθήκη παραγγελίας! </p>';
    
            document.body.append(popup);
        }
    })
}

const ONE_SECOND = 1000

const checkIfElementPresent = setInterval(() => {
    if (document.querySelector("#thankyou-page > div > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(3)")) {
        clearInterval(checkIfElementPresent)
        injectEfoodTracker()
    }
}, ONE_SECOND)