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

(async function () {
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
    // TODO: use current amazon country language (es/en/fr/it...)
    return `https://www.hagglezon.com/en/s/${asinCode}`;
  };

  const cleanAmazonProductPage = (url) => {
    return new URL(url).origin + "/dp/" + getASINFromAmazonURL(url);
  };

  const fetchHagglezonPrices = (url) => {
    return new Promise((resolve, reject) => {
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
              resolve(prices);
            } else {
              reject("tag ul.list-prices not found");
            }
          } else {
            reject("error fetching hagglezon page");
          }
        },
        onerror: function (error) {
          reject("error fetching hagglezon page");
        },
      });
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
    let hagglezonPrices = [];
    try {
      hagglezonPrices = await fetchHagglezonPrices(hagglezonURL);
      console.debug("Fetched prices:", prices);
    } catch (error) {
      console.error(error);
    }
    const html = `<hr><p><a href="${camelCamelCamelLinkURL}" target="_blank"><img alt="camelcamelcamel chart" src="${camelCamelCamelImageURL}"></a></p><hr><p style="text-align: center;"><a href="${hagglezonURL}" target="_blank">Compare prices</a></p><hr>`;
    console.debug("HTML block to append:", html);
    let el = document.getElementById("corePrice_desktop");
    if (el) {
      console.debug("corePrice_desktop html element found, appending block...");
      el.innerHTML += html;
    } else {
      el = document.getElementById("apex_desktop");
      if (el) {
        console.debug("apex_desktop html element found, appending block...");
        el.innerHTML += html;
      } else {
        console.debug("None html element found, can not append block");
      }
    }
  } else {
    console.error("NO ASIN CODE FOUND");
  }
  console.groupEnd();
})();
