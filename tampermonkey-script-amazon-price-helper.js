// ==UserScript==
// @name         tampermonkey-script-amazon-price-helper
// @namespace    https://github.com/aportela/tampermonkey-script-amazon-price-helper
// @version      0.1
// @description  Adds price chart and country store prices to Amazon product pages
// @author       aportela
// @homepage     https://github.com/aportela/tampermonkey-script-amazon-price-helper
// @match        https://www.amazon.com.be/*
// @match        https://www.amazon.co.uk/*
// @match        https://www.amazon.de/*
// @match        https://www.amazon.es/*
// @match        https://www.amazon.fr/*
// @match        https://www.amazon.it/*
// @match        https://www.amazon.ie/*
// @match        https://www.amazon.se/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  "use strict";

  function getASINFromAmazonURL(url) {
    const regex = /\/dp\/([A-Z0-9]{10})/;
    const matches = regex.exec(url);
    if (matches && matches.length == 2) {
      return matches[1];
    } else {
      return null;
    }
  }

  console.groupCollapsed("tampermonkey-script-amazon-price-helper");
  console.debug(getASINFromAmazonURL(window.location.href));
  console.groupEnd();
})();
