/**
 * Javascript for BrowserStack quick launch extension.
 */

const BROWSER_LISTINGS_URL = "https://www.browserstack.com/list-of-browsers-and-platforms.json?product=live";

angular.module('operatingSystemsModule', []).
    filter('operatingSystemFilter', function() {
        return function(browserListings, platformChosen) {
            var filteredBrowserListings = [];
            if (platformChosen == null || platformChosen == "") {
                return filteredBrowserListings;
            }
            for (var i = 0; i < browserListings.length; i++) {
                var browserListing = browserListings[i];
                if (browserListing.platform == platformChosen) {
                    addToArrayIfNotContained(filteredBrowserListings, browserListing.os_display_name);
                }
            }
            return filteredBrowserListings;
        }
}).filter('browserVersionFilter', function() {
    return function (browserListings, platformChosen, browserOS) {
        var filteredBrowserListings = [];
        if (platformChosen == null || platformChosen == "") {
            return filteredBrowserListings;
        }

        if (browserOS == null || browserOS == "") {
            return filteredBrowserListings;
        }
        for (var i = 0; i < browserListings.length; i++) {
            var browserListing = browserListings[i];
            if (platformChosen == browserListing.platform
                && browserOS == browserListing.os_display_name) {
                filteredBrowserListings.push(browserListing);
            }
        }

        return filteredBrowserListings;
    }
});


var quickLaunchApp = angular.module('quickLaunchApp', ['operatingSystemsModule']);

quickLaunchApp.controller('QuickLaunchController', ['$scope', '$http', function($scope, $http) {

    $scope.platformTypes = [];
    $scope.browserListingsData = [];
    $scope.dataLoaded = false;
    $scope.browser = {};

    $http({method: 'GET', url: BROWSER_LISTINGS_URL}).
        success(function(data, status, headers) {
            if (data.hasOwnProperty('desktop') && data.hasOwnProperty('mobile')) {
                parseBrowserListings(data, $scope.platformTypes, $scope.browserListingsData);
                $scope.dataLoaded = true;
            }
        }).
        error(function(data, status, headers) {
            console.log("Got error hen fetching Browser Listings. " + status);
    });

    $scope.openInBStack = function() {
        var startUrl = "http://www.browserstack.com/start#";
        var params = "start=true&scale_to_fit=true&speed=1&os=" + $scope.browser.os;
        if ($scope.browser.platform == 'desktop') {
            params += "&os_version=" + $scope.browser.os_version + "&browser=" + $scope.browser.browser
                + "&browser_version=" + $scope.browser.browser_version;
        } else if ($scope.browser.platform == 'mobile') {
            params += "&device=" + $scope.browser.device;
        }
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            var tabURL = tabs[0].url;
            console.log(tabURL);
            params += "&url=" + tabURL;
            console.log("Final URL :: " + startUrl + params);
            var finalUrl = encodeURI(startUrl + params);
            chrome.tabs.create({ url: finalUrl });
        });
    }

}]);

function parseBrowserListings(responseText, platformTypes, browserListings) {
    var parsedData = responseText;
    for (var platform in parsedData) {
        platformTypes.push(platform);
        console.log("Platform found :: " + platform);
        var platformOses = parsedData[platform];
        for (var i = 0; i < platformOses.length; i++) {
            var platformOs = platformOses[i];
            var osDisplayName = platformOs['os_display_name'];
            var os = platformOs['os'];
            var osVersion = platformOs['os_version'];
            if (platform == 'mobile') {
                addMobileBrowserListings(osDisplayName, os,
                    platformOs['devices'], browserListings);
            } else {
                addDesktopBrowserListings(osDisplayName, os, osVersion,
                    platformOs['browsers'], browserListings);
            }
        }
    }
}

function addMobileBrowserListings (osDisplayName, os, devices, browserListings) {
    for (var i = 0; i < devices.length; i++) {
        var browserListing = {};
        browserListing['platform'] = 'mobile';
        browserListing['os_display_name'] = osDisplayName;
        browserListing['os'] = os;
        for (var key in devices[i]) {
            browserListing[key] = devices[i][key];
        }
        browserListings.push(browserListing);
    }
}

function addDesktopBrowserListings(osDisplayName, os, osVersion, browsers, browserListings) {
    for (var i = 0; i < browsers.length; i++) {
        var browserListing = {};
        browserListing['platform'] = 'desktop';
        browserListing['os_display_name'] = osDisplayName;
        browserListing['os_version'] = osVersion;
        browserListing['os'] = os;
        for (var key in browsers[i]) {
            browserListing[key] = browsers[i][key];
        }
        browserListings.push(browserListing);
    }
}

function addToArrayIfNotContained(array, element) {
    var exists = false;
    for (var i = 0; i < array.length; i++) {
        if (array[i] == element) {
            exists = true;
            break;
        }
    }
    if (!exists) {
        array.push(element);
    }
}
