const noOrders = document.getElementById('no-orders');
const ordersWrapper = document.getElementById('orders-wrapper');
const orderDoneBtn = document.getElementById('order-done');
const moreActionsButton = document.getElementById('more-actions');
const moreActionsButtonImg = document.querySelector('#more-actions img');
const actionButtonsWrapper = document.querySelector('.action-buttons');

orderDoneBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({
        message: 'delete_order_data'
    }, response => {
        if (response.message === 'success') {
            noOrders.style.display = 'block';
            ordersWrapper.style.display = 'none';
        }
    });
});

moreActionsButton.addEventListener('click', (event) => {
    if (event.target.classList.contains('closed')) {
        actionButtonsWrapper.classList.add('all-visible');
        moreActionsButtonImg.style.transform = 'rotate(45deg)';
    } else {
        actionButtonsWrapper.classList.remove('all-visible') ;
        moreActionsButtonImg.style.transform = 'rotate(0deg)';
    }

    event.target.classList.toggle('closed');
});

chrome.runtime.sendMessage({
    message: 'get_order_data'   
}, response => {
    if (response.message === 'success') {
        const order = response.payload.order;

        const timeCountdown = document.getElementById('time-countdown');
        const estimatedArrivalTime = document.getElementById('estimated-arrival-time');
        const storeLogo = document.getElementById('store-logo');
        const storeName = document.getElementById('store-name');
        const storeTelephone = document.getElementById('store-telephone');
        const waitingTimeText = document.querySelector('.waiting-time-text');

        if (order) {
            noOrders.style.display = 'none';
            ordersWrapper.style.display = 'block';

            let estimatedArrival = order.estimated_arrival;
            let humanFriendlyEstimatedArrival = new Date(estimatedArrival);
            let [estimatedArrivalHours, estimatedArrivalMinutes] = formatHoursAndMinutes(humanFriendlyEstimatedArrival);

            function beginCountdown() {
                let now = new Date().getTime();
                let timeDifference = estimatedArrival - now;

                if (timeDifference < 0) {
                    clearInterval();
                    timeCountdown.innerHTML = 0;
                    waitingTimeText.innerHTML = "Η παραγγελία σου φτάνει από στιγμή σε στιγμή!"
                    return;
                }

                let minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
                let seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

                minutes = (minutes < 10) ? `0${minutes}` : minutes;
                seconds = (seconds < 10) ? `0${seconds}` : seconds;

                timeCountdown.innerHTML = `${minutes} λ. ${seconds} δευτ.`;
            };

            beginCountdown();
            setInterval(beginCountdown, 1000);

            estimatedArrivalTime.innerHTML = `${estimatedArrivalHours}:${estimatedArrivalMinutes}`;
            storeLogo.setAttribute('src', order.store_logo_url);
            storeName.innerHTML = order.store_name;
            storeTelephone.innerHTML = order.store_telephone;
        } else {
            noOrders.style.display = 'block';
            ordersWrapper.style.display = 'none';
        }
    }
});

function formatHoursAndMinutes(time) {
    let hours = (time.getHours() < 10) ? `0${time.getHours()}` : time.getHours();
    let minutes = (time.getMinutes() < 10) ? `0${time.getMinutes()}` : time.getMinutes();

    return [hours, minutes];
}