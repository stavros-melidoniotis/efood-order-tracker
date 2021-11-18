let waitingTime = document.querySelector(".thankyou-time").textContent;
let storeLogoUrl = document.querySelector('.thankyou-logo').getAttribute('src');
let storeName = document.querySelector("#main-container > main > section.pb-8.bg-light > div > div > div > div.bg-white.rounded.box-shadow.position-relative.py-12 > div.rounded.text-center > div.row.mt-11 > div.col-12.mt-2.mb-7 > span").textContent;
let storeTelephone = document.querySelector("#main-container > main > section.pb-8.bg-light > div > div > div > div.bg-white.rounded.box-shadow.position-relative.py-12 > div.rounded.text-center > div.d-flex.flex-wrap.px-7.px-lg-12.justify-content-sm-between > div.text-left.pr-5.pr-sm-0.mb-8.mr-auto.ml-sm-3.mr-sm-11 > span > a").textContent;

// Remove minutes symbol from time
waitingTime = waitingTime.replace("'", "");

let currentDate = new Date().getTime();
let estimatedArrivalTime = new Date(currentDate + waitingTime * 60000).getTime();

let urlString = window.location.href;
let url = new URL(urlString);
let orderID = url.searchParams.get("order_id");

function addMinutesToDate(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

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
});