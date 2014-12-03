var request = require('request'),
	Promise = require('bluebird'),
	config = require('config'),
	fs = require('fs');

var baseUrl = 'http://api.tumblr.com/v2/blog/electricobjects.tumblr.com/posts?api_key=' + config.tumblr_api_key + '&limit=50&type=photo';

function getTotalPosts() {

	return new Promise(function(resolve, reject) {

		request(baseUrl, function(error, response, body) {

			if (error) {
				reject(error);
			}

			if (response && response.statusCode === 200) {

				var data = JSON.parse(body);

				if (data && data.meta && data.meta.msg === 'OK' && data.response && data.response.total_posts) {

					resolve(data.response.total_posts);

				} else {

					reject(new Error('Total posts not found in response'));

				}

			} else {

				reject(new Error('HTTP response not 200 OK'));

			}

		});

	});

}


function getImages(offset) {

	if (typeof offset === 'undefined') {
		offset = 0;
	}

	var url = baseUrl + '&offset=' + offset;

	return new Promise(function(resolve, reject) {

		request(url, function(error, response, body) {

			if (error) {
				reject(error);
			}

			if (response && response.statusCode === 200) {

				var data = JSON.parse(body);

				if (data && data.meta && data.meta.msg === 'OK' && data.response) {

					var images = [];

					data.response.posts.forEach(function(post) {
						images.push(post.photos[0].original_size);
					});

					resolve(images);

				} else {

					reject(new Error('Posts not found in response'));

				}

			} else {

				reject(new Error('HTTP response not 200 OK'));

			}

		});

	});

}

getTotalPosts().then(function(totalPosts) {

	var calls = [];

	for (var i = 0; i <= totalPosts; i += 50) {

		(function() {

			var j = i;
			calls.push(getImages(j));

		})();

	}

	Promise.all(calls).then(function(data) {

		var images = [];

		data.forEach(function(batchImages) {
			batchImages.forEach(function(image) {
				images.push(image);
			});
		});

		fs.writeFileSync(__dirname + '/images.json', JSON.stringify(images));
		console.log(images.length + ' images saved in images.json');

		fs.writeFileSync(__dirname + '/web/images.js', 'var images = ' + JSON.stringify(images) + ';');
		console.log(images.length + ' images saved in web/images.js');


	});

});