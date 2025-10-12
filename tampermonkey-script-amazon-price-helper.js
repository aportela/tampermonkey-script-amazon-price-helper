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

  const getASINFromAmazonURL = (url) => {
    const regex = /\/dp\/([A-Z0-9]{10})/;
    const matches = regex.exec(url);
    if (matches && matches.length == 2) {
      return matches[1];
    } else {
      return null;
    }
  };

  const getCamelCamelCamelGraphImageURL = (asinCode) => {
    return `https://charts.camelcamelcamel.com/es/${asinCode}/amazon.png?force=1&zero=0&w=725&h=440&desired=false&legend=1&ilt=1&tp=all&fo=0&lang=es_ES`;
  };

  const getCamelCamelCamelLinkURL = (asinCode) => {
    return `https://es.camelcamelcamel.com/product/${asinCode}`;
  };

  const getHagglezonLinkURL = (asinCode) => {
    return `https://www.hagglezon.com/es/s/${asinCode}`;
  };

  console.groupCollapsed("tampermonkey-script-amazon-price-helper");
  const ASIN = getASINFromAmazonURL(window.location.href);
  if (ASIN) {
    console.debug("ASIN CODE:", ASIN);
    const camelCamelCamelImageURL = getCamelCamelCamelGraphImageURL(ASIN);
    console.debug("CamelCamelCamel image URL:", camelCamelCamelImageURL);
    const camelCamelCamelLinkURL = getCamelCamelCamelLinkURL(ASIN);
    console.debug("CamelCamelCamel link URL:", camelCamelCamelLinkURL);
    const hagglezonURL = getHagglezonLinkURL(ASIN);
    console.debug("Hagglezon URL:", hagglezonURL);
  } else {
    console.error("NO ASIN CODE FOUND");
  }
  console.groupEnd();
})();
