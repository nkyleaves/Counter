// https://developers.google.com/web/fundamentals/primers/service-workers/?hl=ja

//キャッシュの設定
var CACHE_NAME = 'Counter-cash';
var urlsToCache = [
	'/apps/Counter/app.html',
	'/apps/Counter/app.css',
	'/apps/Counter/app.js',
];

//インストール
self.addEventListener('install', function(event) {
	event.waitUntil(caches.open(CACHE_NAME).then(function(cache) {
			//console.log('Opened cache');
			return cache.addAll(urlsToCache);
      })
	);
});

//古いキャッシュの削除
self.addEventListener('activate', function(event) {
	var cacheWhitelist = [CACHE_NAME, ];
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.map(function(cacheName) {
					//console.log('delete old cache');
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName);
			  		}
				})
			);
		})
	);
});
 
//キャッシュの利用
self.addEventListener('fetch', function(event) {
	//console.log('fetch');
	event.respondWith(caches.match(event.request).then(function(response) {
		// Cache hit - return response
		if (response) {
			return response;
		}

		var fetchRequest = event.request.clone();

		return fetch(fetchRequest).then(
			function(response) {
			// Check if we received a valid response
			if(!response || response.status !== 200 || response.type !== 'basic') {
				return response;
			}

			var responseToCache = response.clone();

			caches.open(CACHE_NAME)
				.then(function(cache) {
				cache.put(event.request, responseToCache);
			});

			return response;
		});
	}));
});
