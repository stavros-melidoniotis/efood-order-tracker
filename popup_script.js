console.log('Popup console log.')


// let skipOrderFetching = document.getElementById('skip-order-fetching');

// console.log(skipOrderFetching)

// if (!skipOrderFetching) {
    // console.log('fetching');

    chrome.runtime.sendMessage({
        message: 'get_order_data'   
    }, response => {
        if (response.message === 'success') {
            let order = response.payload.order;

            if (order) {
                document.getElementById('no-orders').style.display = 'none';
                document.getElementById('orders-wrapper').style.display = 'block';

                document.getElementById('time-countdown').innerHTML = order.waiting_time;
                document.getElementById('estimated-arrival-time').innerHTML = order.estimated_arrival;
                document.getElementById('telephone').setAttribute('href', `tel:+30${order.store_telephone}`);

                // let hiddenInput = document.createElement('input');
                // hiddenInput.setAttribute('type', 'hidden');
                // hiddenInput.setAttribute('id', 'skip-order-fetching');
                // document.querySelector('#orders-wrapper').appendChild(hiddenInput);
            } else {
                document.getElementById('no-orders').style.display = 'block';
                document.getElementById('orders-wrapper').style.display = 'none';
            }
        }
    });
// } else {
//     console.log('skipping');
// }