const CACHE_NAME =
    "nutritrack-v2";


const FILES = [

    "./",

    "./index.html",

    "./manifest.json",

    "./css/style.css",

    "./js/foods.js",

    "./js/app.js",

    "./images/background.jpg"

];


self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(
                CACHE_NAME
            )
            .then(
                cache =>
                    cache.addAll(
                        FILES
                    )
            )

        );

    }
);


self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(
                    keys =>
                        Promise.all(
                            keys
                                .filter(
                                    key =>
                                        key !==
                                        CACHE_NAME
                                )
                                .map(
                                    key =>
                                        caches.delete(
                                            key
                                        )
                                )
                        )
                )

        );

    }
);


self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            caches.match(
                event.request
            )
            .then(
                cached => {

                    return cached ||
                        fetch(
                            event.request
                        );

                }
            )

        );

    }
);