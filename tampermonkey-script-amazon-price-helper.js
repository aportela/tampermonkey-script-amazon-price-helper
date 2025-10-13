// ==UserScript==
// @name         tampermonkey-script-amazon-price-helper
// @namespace    https://github.com/aportela/tampermonkey-script-amazon-price-helper
// @version      0.1
// @description  Adds price chart and country store prices to Amazon product pages
// @author       aportela
// @homepage     https://github.com/aportela/tampermonkey-script-amazon-price-helper
// @match        https://www.amazon.com.au/*
// @match        https://www.amazon.com.be/*
// @match        https://www.amazon.ca/*
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

  const css = `

  div#dp
  {
    max-width: 98% !important;
  }

  .prices-container
  {
      display: flex;
      flex-wrap: wrap;
      gap: 1em;
  }

  .price-current
  {
    border: 1px solid  rgba(128, 128, 128, 1) ! important;
    background: rgba(228, 228, 228, 1);
  }

  .price-link
  {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: calc(25% - 1em); /* four columns */
      text-align: center;
      border: 1px solid  rgba(255, 255, 255, 1);
      padding: 4px 0px;
  }

  .price-link:hover {
    text-decoration: none;
    border: 1px solid  rgba(185, 185, 185, 1);
    background: rgba(238, 238, 238, 1);
  }

  .price-image
  {
      width: 24px;
      height: 24px;
      margin-bottom: 0.5em;
  }

  @media (max-width: 768px)
  {
      .price-link
      {
          width: calc(50% - 1em); /* 2 columns on small screens */
      }
  }

  @media (max-width: 480px)
  {
      .price-link
      {
          width: 100%; /* 1 column on smaller screens */
      }
  }

  `;

  // grow page width
  GM_addStyle(css);

  const getASINFromAmazonURL = (url) => {
    const regex = /\/dp\/([A-Z0-9]{10})/;
    const matches = regex.exec(url);
    if (matches && matches.length == 2) {
      return matches[1];
    } else {
      return null;
    }
  };

  const getCamelCamelCamelGraphImageURL = (asinCode, lang = "en") => {
    if (lang == "de" || lang == "es" || lang == "fr" || lang == "it") {
      return `https://charts.camelcamelcamel.com/${lang}/${asinCode}/amazon.png?force=1&zero=0&w=725&h=440&desired=false&legend=1&ilt=1&tp=all&fo=0&lang=${lang}`;
    } else {
      return `https://charts.camelcamelcamel.com/us/${asinCode}/amazon.png?force=1&zero=0&w=725&h=440&desired=false&legend=1&ilt=1&tp=all&fo=0&lang=en`;
    }
  };

  const getCamelCamelCamelCountryFromURL = (url) => {
    let country = null;
    const parsedUrl = new URL(url);
    switch (parsedUrl.hostname) {
      case "www.amazon.com.au":
        country = "au";
      case "www.amazon.ca":
        country = "ca";
        break;
      case "www.amazon.de":
        country = "de";
        break;
      case "www.amazon.es":
        country = "es";
        break;
      case "www.amazon.fr":
        country = "fr";
        break;
      case "www.amazon.it":
        country = "it";
        break;
      case "www.amazon.co.uk":
        country = "uk";
        break;
      case "www.amazon.com":
      default:
        country = "us";
        break;
    }
    return country;
  };

  const getCamelCamelCamelLangFromURL = (url) => {
    let language = null;
    const parsedUrl = new URL(url);
    switch (parsedUrl.hostname) {
      case "www.amazon.de":
        language = "de";
        break;
      case "www.amazon.es":
        language = "es";
        break;
      case "www.amazon.fr":
        language = "fr";
        break;
      case "www.amazon.it":
        language = "it";
        break;
      case "www.amazon.com.au":
      case "www.amazon.ca":
      case "www.amazon.co.uk":
      case "www.amazon.com":
      default:
        language = "en";
        break;
    }
    return language;
  };

  const camelCamelCamelCountries = [
    "au",
    "ca",
    "de",
    "es",
    "fr",
    "it",
    "uk",
    "us",
  ];

  const getCamelCamelCamelLinkURL = (asinCode, country = "us") => {
    if (camelCamelCamelCountries.includes(country)) {
      return `https://${country}.camelcamelcamel.com/product/${asinCode}`;
    } else {
      return `https://us.camelcamelcamel.com/product/${asinCode}`;
    }
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
              const currentAmazonDomain = new URL(window.location.href)
                .hostname;
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
                    currentDomain:
                      currentAmazonDomain == new URL(link.href).hostname,
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
    const camelCamelCamelImageURL = getCamelCamelCamelGraphImageURL(
      ASIN,
      getCamelCamelCamelLangFromURL(window.location.href)
    );
    console.debug("CamelCamelCamel image URL:", camelCamelCamelImageURL);
    const camelCamelCamelLinkURL = getCamelCamelCamelLinkURL(
      ASIN,
      getCamelCamelCamelCountryFromURL(window.location.href)
    );
    console.debug("CamelCamelCamel link URL:", camelCamelCamelLinkURL);
    const hagglezonURL = getHagglezonLinkURL(ASIN);
    console.debug("Hagglezon URL:", hagglezonURL);
    let hagglezonPrices = [];
    try {
      hagglezonPrices = await fetchHagglezonPrices(hagglezonURL);
      console.debug("Fetched prices:", hagglezonPrices);
    } catch (error) {
      console.error(error);
    }
    const pricesHTMLList = hagglezonPrices
      .map((price) => {
        const currentDomainClass = price.currentDomain ? "price-current" : "";
        return `<a class="price-link ${currentDomainClass}" href="${price.url}"><img class="price-image" src="${price.countryImage}" alt="Country flag">${price.price}</a>`;
      })
      .join("");

    const html = `
    <hr>
    <p>
      <a href="${camelCamelCamelLinkURL}" target="_blank"><img alt="camelcamelcamel chart" src="${camelCamelCamelImageURL}" rel="noreferrer" referrerpolicy="no-referrer"></a>
    </p>
    <hr>
    <p style="text-align: center;">
      <a href="${hagglezonURL}" target="_blank">Compare prices</a>
      <p class="prices-container">${pricesHTMLList}</p>
    </p>
    <hr>`;
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
