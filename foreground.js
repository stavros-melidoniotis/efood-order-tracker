let waitingTime = document.querySelector(".thankyou-time").textContent;
let storeTelephone = document.querySelector("#main-container > main > section.pb-8.bg-light > div > div > div > div.bg-white.rounded.box-shadow.position-relative.py-12 > div.rounded.text-center > div.d-flex.flex-wrap.px-7.px-lg-12.justify-content-sm-between > div.text-left.pr-5.pr-sm-0.mb-8.mr-auto.ml-sm-3.mr-sm-11 > span > a").textContent;

// Remove minutes symbol from time
waitingTime = waitingTime.replace("'", "");

let currentDate = new Date();
let estimatedArrivalTime = addMinutesToDate(currentDate, waitingTime);

estimatedArrivalTime = `${estimatedArrivalTime.getHours()}:${estimatedArrivalTime.getMinutes()}`;

// alert(`Waiting time: ${waitingTime}, Estimated arrival: ${estimatedArrivalTime}, Store phone: ${storeTelephone}`)

function addMinutesToDate(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

chrome.runtime.sendMessage({
    message: 'save_order_data',
    payload: {
        waiting_time: waitingTime,
        estimated_arrival: estimatedArrivalTime,
        store_telephone: storeTelephone
    }
}, response => {
    if (response.message === 'success') {
        console.log('New order data saved!');
    }
});