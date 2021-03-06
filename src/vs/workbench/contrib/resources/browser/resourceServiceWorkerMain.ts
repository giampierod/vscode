/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// trigger service worker updates
const _tag = '586d4b79-f5c4-4aff-9a14-2139ddfbb486';

(function () {

	type Handler = {
		handleFetchEvent(event: Event): Promise<Response | undefined>;
		handleMessageEvent(event: MessageEvent): void;
	};

	const handlerPromise = new Promise<Handler>((resolve, reject) => {
		// load loader
		const baseUrl = '../../../../../';
		importScripts(baseUrl + 'vs/loader.js');
		require.config({
			baseUrl,
			catchError: true
		});
		require(['vs/workbench/contrib/resources/browser/resourceServiceWorker'], resolve, reject);
	});

	self.addEventListener('message', event => {
		handlerPromise.then(handler => {
			handler.handleMessageEvent(event);
		});
	});

	self.addEventListener('fetch', (event: any) => {
		event.respondWith(handlerPromise.then(async handler => {
			// try handler
			const value = await handler.handleFetchEvent(event);
			if (value instanceof Response) {
				return value;
			}
			// try the network (prefetch or fetch)
			return event.preloadResponse || fetch(event.request);
		}));
	});
	self.addEventListener('install', (event: any) => {
		event.waitUntil((self as any).skipWaiting());
	});

	self.addEventListener('activate', (event: any) => {

		event.waitUntil((async () => {
			if ((self as any).registration.navigationPreload) {
				await (self as any).registration.navigationPreload.enable(); // Enable navigation preloads!
			}
			await (self as any).clients.claim(); // Become available to all pages
		})());
	});
})();
