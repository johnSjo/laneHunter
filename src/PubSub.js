export default {

    create () {

        const subscriptions = [];

        function publish (topic, message) {

            subscriptions.filter((subscription) => subscription.topic === topic).
                forEach((subscription) => {
                    subscription.callback(message);
                });
        }

        function subscribe (topic, callback) {

            const subscription = {
                topic,
                callback
            };

            subscriptions.push(subscription);

            return subscription;

        }

        function subscribeOnce (topic, callback) {

            const subscription = subscribe(topic, callback);
            const unsubscription = subscribe(topic, unsubscriber);

            function unsubscriber () {
                unsubscribe(subscription);
                unsubscribe(unsubscription);
            }

        }

        function unsubscribe (subscription) {

            const subscriptionIndex = subscriptions.indexOf(subscription);

            if (subscriptionIndex >= 0) {
                subscriptions.splice(subscriptionIndex, 1);
            }

        }

        return { publish, subscribe, subscribeOnce, unsubscribe };

    }

};