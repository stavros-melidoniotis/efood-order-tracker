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
        const order = response.payload;

        const timeCountdown = document.getElementById('time-countdown');
        const estimatedArrivalTime = document.getElementById('estimated-arrival-time');
        const storeLogo = document.getElementById('store-logo');
        const storeName = document.getElementById('store-name');
        const orderTotal = document.getElementById('order-total');
        const storeTelephone = document.getElementById('store-telephone');
        const orderItems = document.getElementById('order-items');
        const waitingTimeText = document.querySelector('.waiting-time-text');

        if (order) {
            noOrders.style.display = 'none';
            ordersWrapper.style.display = 'block';

            let estimatedArrival = order.estimated_arrival;
            let humanFriendlyEstimatedArrival = new Date(estimatedArrival);
            let [estimatedArrivalHours, estimatedArrivalMinutes] = formatHoursAndMinutes(humanFriendlyEstimatedArrival);

            const remindOrderBtn = document.getElementById('remind-order');

            remindOrderBtn.addEventListener('click', function() {
                const toggle = this.dataset.toggle;
                const orderItems = document.getElementById('order-items');
                const remindOrderArrow = document.getElementById('remind-order-arrow');
            
                if (toggle === 'on') {
                    this.dataset.toggle = 'off';
                    orderItems.classList.add('open')
                    remindOrderArrow.setAttribute('src', './images/chevron-down-solid.svg')
            
                    return;
                }
            
                this.dataset.toggle = 'on';
                orderItems.classList.remove('open')
                remindOrderArrow.setAttribute('src', './images/chevron-right-solid.svg')
            })

            let efoodTimerInterval = null;

            // start the countdown immediately
            beginCountdown();
            // and run it again every 1 second
            efoodTimerInterval = setInterval(beginCountdown, 1000);

            function beginCountdown() {
                let now = new Date().getTime();
                let timeDifference = estimatedArrival - now;

                if (timeDifference < 0 && efoodTimerInterval) {
                    clearInterval(efoodTimerInterval);
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

            estimatedArrivalTime.innerHTML = `${estimatedArrivalHours}:${estimatedArrivalMinutes}`;
            storeLogo.setAttribute('src', order.store_logo_url);
            storeName.innerHTML = order.store_name;
            orderTotal.innerHTML = order.order_total;
            storeTelephone.innerHTML = order.store_telephone;
            orderItems.innerHTML = listOfOrderItems(order.order_items);
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

function listOfOrderItems(orderItems) {
    const orderItemsJSON = JSON.parse(orderItems)

    let list = '<ul>'

    for (let orderItem of orderItemsJSON) {
        list += `
            <li>
                <div>
                    <span class="item-quantity"> ${orderItem.quantity}x</span>
                    <span class="item-item"> ${orderItem.item} - </span>
                    <span class="item-price"> ${orderItem.price} </span>
                </div>
                <div class="faded-text">
                    <span class="item-details"> ${orderItem.itemDetails} </span>
                </div>
            </li>`
    }

    list += '</ul>'

    return list
}