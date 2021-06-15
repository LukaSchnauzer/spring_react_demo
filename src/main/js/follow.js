export default function follow(rootPath, relArray) {
	const root = fetch(rootPath).then(response => response.json());

	return relArray.reduce(function(root, arrayItem) {
		const rel = typeof arrayItem === 'string' ? arrayItem : arrayItem.rel;
		return traverseNext(root, rel, arrayItem);
	}, root);

	function traverseNext (root, rel, arrayItem) {
		return root.then(function (response) {
			if (hasEmbeddedRel(response, rel)) {
				return response._embedded[rel];
			}

			if(!response._links) {
				return [];
			}

			if (typeof arrayItem === 'string') {
				return fetch(response._links[rel].href.split('{')[0]).then(response => response.json());
			} else {
				const url =new URL(response._links[rel].href.split('{')[0]);
				url.search = new URLSearchParams(arrayItem.params).toString();
				return fetch(url).then(response => response.json());
			}
		});
	}

	function hasEmbeddedRel (entity, rel) {
		return entity._embedded && entity._embedded.hasOwnProperty(rel);
	}
};