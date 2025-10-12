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

  const cleanAmazonProductPage = (url) => {
    return new URL(url).origin + "/dp/" + getASINFromAmazonURL(url);
  };

  const fetchHagglezonPrices = (url) => {
    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      onload: function (response) {
        if (response.status === 200) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(
            response.responseText,
            "text/html"
          );
          const pricesList = doc.querySelector("ul.list-prices");
          if (pricesList) {
            const prices = Array.from(pricesList.querySelectorAll("li")).map(
              (item) => {
                const link = item.querySelector("a");
                const img = item.querySelector("img");
                let imgSrc = img.getAttribute("src");
                if (imgSrc.startsWith("/assets/")) {
                  imgSrc = `https://www.hagglezon.com${imgSrc}`;
                }
                const price = item.querySelector(".price");
                return {
                  url: link ? cleanAmazonProductPage(link.href) : null,
                  countryImage: img ? imgSrc : null,
                  price: price ? price.textContent : null,
                };
              }
            );
            console.log(prices);
          } else {
            console.error("tag ul.list-prices not found");
          }
        } else {
          console.error("error fetching hagglezon page");
        }
      },
      onerror: function (error) {
        console.error("error fetching hagglezon page");
      },
    });
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
    fetchHagglezonPrices(hagglezonURL);
  } else {
    console.error("NO ASIN CODE FOUND");
  }
  console.groupEnd();
})();
