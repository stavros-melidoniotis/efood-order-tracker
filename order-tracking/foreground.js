const injectEfoodTracker = () => {
    let waitingTime = getElementByXpath("//div[contains(text(),'Η παραγγελία σου θα παραδοθεί σε')]").textContent
    const waitingTimeParts = waitingTime.split(' ')

    waitingTime = waitingTimeParts[waitingTimeParts.length - 1]

    const storeName = getElementByXpath("//h4[contains(text(),'Κατάστημα')]")?.nextSibling.textContent
    const storeLogoUrl = getElementByXpath("//h4[contains(text(),'Κατάστημα')]")?.parentElement.previousSibling.getAttribute('src')
    const orderTotal = getElementByXpath("//h4[contains(text(),'Σύνολο παραγγελίας')]")?.nextSibling.textContent
    const storeTelephone = getElementByXpath("//div[contains(text(),'Επικοινωνία με το κατάστημα')]")?.nextSibling.nextSibling.lastChild.textContent
    const orderItems = getElementByXpath("//h4[contains(text(),'Καλάθι')]")?.nextSibling.children

    const orderItemsArray = []

    for (let orderItem of orderItems) {
        const orderItemWrapper = orderItem.firstChild
    
        const quantity = orderItemWrapper.children[0].textContent
        const item = orderItemWrapper.children[1]
        const itemName = item.children[0].textContent
        const itemDetails = (item.children.length > 1) ? item.children[1].textContent : ''
        const price = orderItemWrapper.children[2].textContent

        orderItemsArray.push({
            quantity: quantity,
            item: itemName,
            itemDetails: itemDetails,
            price: price
        })
    }

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
            store_telephone: storeTelephone,
            order_items: JSON.stringify(orderItemsArray)
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

const getElementByXpath = (path) => {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
}

const checkIfElementPresent = setInterval(() => {
    let arrivalTimeDiv = getElementByXpath("//div[contains(text(),'Η παραγγελία σου θα παραδοθεί σε')]")

    if (arrivalTimeDiv) {
        clearInterval(checkIfElementPresent)
        injectEfoodTracker()
    }
}, ONE_SECOND)