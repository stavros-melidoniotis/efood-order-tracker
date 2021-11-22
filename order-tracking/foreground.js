const injectEfoodTracker = () => {
    let waitingTime = document.querySelector("#thankyou-page > div > div.sc-eFuaqX.gdCzPe > div.sc-dvHJEY.iOfqcq > div.sc-hKiyAV.KYfTk.sc-ekkLND.cSZSUG > div > div.sc-jsNtJQ.PUKWe > div > div > div > div.sc-gWnPEt.meGv").textContent
    let waitingTimeParts = waitingTime.split(' ')

    waitingTime = waitingTimeParts[waitingTimeParts.length - 1]
    
    let storeLogoUrl = document.querySelector("#thankyou-page > div > div.sc-eFuaqX.gdCzPe > div.sc-dvHJEY.iOfqcq > div.sc-hKiyAV.KYfTk.sc-ekkLND.cSZSUG > div > div.sc-fteDCE.rybhY > div.sc-gJnOmN.eMvLE > div > div.sc-brWPEp.sc-kJJesS.dWfpyh.dUOVnS > div:nth-child(1) > img").getAttribute('src')
    let storeName = document.querySelector("#thankyou-page > div > div.sc-eFuaqX.gdCzPe > div.sc-dvHJEY.iOfqcq > div.sc-hKiyAV.KYfTk.sc-ekkLND.cSZSUG > div > div.sc-fteDCE.rybhY > div.sc-gJnOmN.eMvLE > div > div.sc-brWPEp.sc-kJJesS.dWfpyh.dUOVnS > div:nth-child(1) > div > div").textContent
    let storeTelephone = document.querySelector("#thankyou-page > div > div.sc-eFuaqX.gdCzPe > div.sc-dvHJEY.iOfqcq > div.sc-hKiyAV.KYfTk.sc-ekkLND.cSZSUG > div > div.sc-fteDCE.rybhY > div.sc-fUiULZ.dpvLfM > div.sc-eHOjHr.ggXwBv > div.sc-jZtgMJ.eGdNHb.sc-igsIFi.jZvJjj > a > span").textContent
    
    // Remove minutes symbol from time
    waitingTime = waitingTime.replace("'", "")
    
    let currentDate = new Date().getTime()
    let estimatedArrivalTime = new Date(currentDate + waitingTime * 60000).getTime()
    
    let urlString = window.location.href
    let url = new URL(urlString)
    let orderID = url.searchParams.get("order_id")
    
    chrome.runtime.sendMessage({
        message: 'save_order_data',
        payload: {
            order_id: orderID,
            order_datetime: currentDate,
            waiting_time: waitingTime,
            estimated_arrival: estimatedArrivalTime,
            store_logo_url: storeLogoUrl,
            store_name: storeName,
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
    if (document.querySelector("#thankyou-page > div > div.sc-eFuaqX.gdCzPe > div.sc-dvHJEY.iOfqcq > div.sc-hKiyAV.KYfTk.sc-ekkLND.cSZSUG > div > div.sc-jsNtJQ.PUKWe > div > div > div > div.sc-gWnPEt.meGv")) {
        injectEfoodTracker()
        clearInterval(checkIfElementPresent)
    }
}, ONE_SECOND)