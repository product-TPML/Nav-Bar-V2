/**
 * Shared responsive navigation behavior.
 * Plain JS, no dependencies.
 */
(function () {
  "use strict";

  var popupTimer = null;
  var drawer = document.getElementById("site-drawer");
  var popup = document.getElementById("premium-popup");
  var gooStage = document.querySelector(".goo-stage");
  var gooBlob = document.querySelector(".goo-blob");
  var siteHeader = document.querySelector(".site-header");
  var desktopBreakpoint = window.matchMedia("(min-width: 1024px)");
  var lastScrollY = window.scrollY;
  var lastScrollAt = Date.now();
  var lastScrollDirection = "stationary";
  var upwardBurstActive = false;
  var upwardBurstCount = 0;
  var upwardBurstStartedAt = 0;
  var upwardBurstResetTimer = null;
  var subscriberBottomRevealTimer = null;
  var menuApiBases = {
    pv: "https://www.prajavani.net",
    dh: "https://www.deccanherald.com"
  };

  function qsa(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function setPublicationCopy(selector, values, isDh) {
    qsa(selector).forEach(function (element, index) {
      if (!element.hasAttribute("data-pv-copy")) {
        element.setAttribute("data-pv-copy", element.textContent.trim());
      }

      if (isDh && values[index] !== undefined) {
        element.textContent = values[index];
      } else {
        element.textContent = element.getAttribute("data-pv-copy");
      }
    });
  }

  function setPublicationAttributes(selector, attribute, values, isDh) {
    qsa(selector).forEach(function (element, index) {
      var originalAttribute = "data-pv-" + attribute;

      if (!element.hasAttribute(originalAttribute)) {
        element.setAttribute(originalAttribute, element.getAttribute(attribute) || "");
      }

      if (isDh && values[index] !== undefined) {
        element.setAttribute(attribute, values[index]);
      } else {
        element.setAttribute(attribute, element.getAttribute(originalAttribute));
      }
    });
  }

  function syncDesktopOfferingLinks(isDh) {
    var drawerOfferings = qsa(".drawer__premium-item");
    var desktopOfferings = [
      ".site-header__primary-premium",
      ".site-header__utility-link--highlight",
      ".site-header__topic-premium"
    ];
    var desktopEpaper = [
      ".site-header__mobile-epaper",
      ".site-header__utility-link:nth-child(2)",
      ".site-header__topic-epaper"
    ];

    desktopOfferings.forEach(function (selector) {
      var link = document.querySelector(selector);
      if (link && drawerOfferings[0]) {
        link.href = drawerOfferings[0].href;
      }
    });

    desktopEpaper.forEach(function (selector) {
      var link = document.querySelector(selector);
      if (link && drawerOfferings[1]) {
        link.href = drawerOfferings[1].href;
      }
    });

    qsa(".site-header__utility-link:nth-child(n+3), .site-header__topic-premium-extra").forEach(function (link) {
      link.hidden = isDh;
    });
  }

  function getApiMenuHref(item, base) {
    var href = item && (item.url || (item.data && item.data.link) || item["collection-slug"]);
    if (!href) {
      return "#";
    }

    if (/^https?:\/\//i.test(href)) {
      return href;
    }

    return base + (href.charAt(0) === "/" ? href : "/" + href);
  }

  function getApiMenuItems(group, fallback) {
    return group && Array.isArray(group.items) && group.items.length ? group.items : fallback;
  }

  function getRootApiMenuItems(items) {
    return (Array.isArray(items) ? items : []).filter(function (item) {
      return item && item.title && (item["parent-id"] == null || item["parent-id"] === 0);
    });
  }

  function isMenuItemExcluded(item) {
    return !item || !item.title || isSubscriptionOffering(item.title);
  }

  function isDrawerMenuItemExcluded(item) {
    return !item || !item.title || /premium|sudha|mayura|subscribe|subscription/i.test(item.title);
  }

  function renderDrawerQuicklinks(items, base) {
    var quicklinks = document.querySelector(".drawer__quicklinks");
    if (!quicklinks || !Array.isArray(items) || !items.length) {
      return;
    }

    qsa(".drawer__quickchip", quicklinks).forEach(function (link) {
      link.remove();
    });

    getRootApiMenuItems(items).slice(0, 7).filter(function (item) {
      return !isDrawerMenuItemExcluded(item);
    }).forEach(function (item) {
      var link = document.createElement("a");
      link.className = "drawer__quickchip";
      link.href = getApiMenuHref(item, base);
      link.textContent = item.title.trim();
      link.setAttribute("data-api-menu-item", "true");
      quicklinks.appendChild(link);
    });
  }

  function renderDrawerCatalog(items, base) {
    var catalog = document.querySelector(".drawer__catalog");
    var roots = getRootApiMenuItems(items).filter(function (item) {
      return !isDrawerMenuItemExcluded(item);
    });

    if (!catalog || !roots.length) {
      return;
    }

    var allItems = Array.isArray(items) ? items : [];
    var fragment = document.createDocumentFragment();

    roots.forEach(function (rootItem) {
      var children = allItems.filter(function (item) {
        return item && String(item["parent-id"]) === String(rootItem.id) && !isDrawerMenuItemExcluded(item);
      });
      var rootHref = getApiMenuHref(rootItem, base);

      if (!children.length) {
        var directLink = document.createElement("a");
        directLink.href = rootHref;
        directLink.className = "drawer-card drawer-card--link";
        directLink.setAttribute("data-api-menu-item", "true");
        var directMain = document.createElement("span");
        directMain.className = "drawer-card__main";
        var directTitle = document.createElement("span");
        directTitle.className = "drawer-card__title";
        directTitle.textContent = rootItem.title.trim();
        directMain.appendChild(directTitle);
        directLink.appendChild(directMain);
        fragment.appendChild(directLink);
        return;
      }

      var card = document.createElement("div");
      card.className = "drawer-card";
      var trigger = document.createElement("div");
      trigger.className = "drawer-card__trigger";
      var submenuId = "api-submenu-" + rootItem.id;

      var main = document.createElement("a");
      main.className = "drawer-card__main";
      main.href = rootHref;
      main.setAttribute("data-api-menu-item", "true");
      var title = document.createElement("span");
      title.className = "drawer-card__title";
      title.textContent = rootItem.title.trim();
      main.appendChild(title);

      var meta = document.createElement("span");
      meta.className = "drawer-card__meta";
      var moreLabel = document.body.classList.contains("is-dh") ? "and more" : "ಇನ್ನುಷ್ಟು";
      meta.textContent = children.slice(0, 2).map(function (item) {
        return item.title.trim();
      }).join(", ") + (children.length > 2 ? " " + moreLabel : "");
      main.appendChild(meta);

      var icon = document.createElement("button");
      icon.type = "button";
      icon.className = "drawer-card__icon";
      icon.setAttribute("data-toggle-submenu", "true");
      icon.setAttribute("aria-expanded", "false");
      icon.setAttribute("aria-controls", submenuId);
      icon.setAttribute("aria-label", "Expand " + rootItem.title.trim());
      icon.setAttribute("data-icon", "arrow");
      trigger.appendChild(main);
      trigger.appendChild(icon);
      card.appendChild(trigger);

      var submenu = document.createElement("div");
      submenu.className = "drawer-card__submenu";
      submenu.id = submenuId;
      children.forEach(function (child) {
        var childLink = document.createElement("a");
        childLink.className = "drawer-card__submenu-link";
        childLink.href = getApiMenuHref(child, base);
        childLink.textContent = child.title.trim();
        childLink.setAttribute("data-api-menu-item", "true");
        submenu.appendChild(childLink);
      });
      card.appendChild(submenu);
      fragment.appendChild(card);
    });

    catalog.replaceChildren(fragment);
    buildIcons();
  }

  function isSubscriptionOffering(title) {
    return /premium|e-?paper|sudha|mayura|subscribe|subscription/i.test(title || "");
  }

  function renderApiMenu(menuName, items, limit, rootsOnly) {
    var status = document.querySelector('[data-api-menu-status="' + menuName + '"]');
    var container = status ? status.parentElement : null;
    if (!container || !status) {
      return;
    }

    if (menuName === "default" && rootsOnly) {
      qsa(".site-header__primary-item", container).forEach(function (item) {
        item.remove();
      });
    } else {
      qsa("a[data-api-menu-item]", container).forEach(function (link) {
        link.remove();
      });
    }

    var visibleItems = (Array.isArray(items) ? items : [])
      .filter(function (item) {
        if (!item || !item.title || isSubscriptionOffering(item.title)) {
          return false;
        }

        var isRoot = item["parent-id"] == null || item["parent-id"] === 0;
        return !rootsOnly || isRoot;
      })
      .slice(0, limit);

    visibleItems.forEach(function (item) {
      var base = menuApiBases[document.body.classList.contains("is-dh") ? "dh" : "pv"];
      var link = document.createElement("a");
      link.href = getApiMenuHref(item, base);
      link.textContent = item.title.trim();
      link.setAttribute("data-api-menu-item", "true");

      if (menuName === "default" && rootsOnly) {
        var wrapper = document.createElement("div");
        wrapper.className = "site-header__primary-item";
        wrapper.appendChild(link);

        var children = (Array.isArray(items) ? items : []).filter(function (child) {
          return child && child.title && String(child["parent-id"]) === String(item.id) && !isMenuItemExcluded(child);
        });

        if (children.length) {
          var dropdown = document.createElement("div");
          dropdown.className = "site-header__primary-dropdown";
          if (children.length > 10) {
            dropdown.classList.add("is-multi-column");
            dropdown.style.setProperty("--primary-submenu-columns", String(Math.ceil(children.length / 10)));
            dropdown.style.setProperty("--primary-submenu-rows", "10");
          }
          children.forEach(function (child) {
            var childLink = document.createElement("a");
            childLink.className = "site-header__primary-dropdown-link";
            childLink.href = getApiMenuHref(child, base);
            childLink.textContent = child.title.trim();
            childLink.setAttribute("data-api-menu-item", "true");
            dropdown.appendChild(childLink);
          });
          wrapper.appendChild(dropdown);
        }

        status.before(wrapper);
      } else {
        status.before(link);
      }
    });

    status.hidden = visibleItems.length > 0;
    if (visibleItems.length === 0) {
      status.textContent = "ವಿಭಾಗಗಳು ಲಭ್ಯವಿಲ್ಲ";
    }
  }

  function getFallbackMenus(brand) {
    if (brand === "dh") {
      return {
        primary: ["Districts", "News", "Entertainment", "Opinion", "Astrology", "Our Voice"],
        secondary: ["Districts", "News", "Entertainment", "Opinion", "Astrology", "Sports", "Business"]
      };
    }

    return {
      primary: ["ಜಿಲ್ಲೆ", "ಸುದ್ದಿ", "ಸಿನಿಮಾ ರಂಜನೆ", "ಅಭಿಮತ", "ವಾಸ್ತು-ಜ್ಯೋತಿಷ್ಯ", "ನಮ್ಮ ಮಾತುತಿ"],
      secondary: ["ಜಿಲ್ಲೆ", "ಸುದ್ದಿ", "ಸಿನಿಮಾ ರಂಜನೆ", "ಅಭಿಮತ", "ವಾಸ್ತು-ಜ್ಯೋತಿಷ್ಯ", "ಕ್ರೀಡೆ", "ವ್ಯಾಪಾರ"]
    };
  }

  function loadApiMenus() {
    var brand = document.body.classList.contains("is-dh") ? "dh" : "pv";
    var fallback = getFallbackMenus(brand);
    return fetch("/api/menu-groups?brand=" + brand)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Menu API returned " + response.status);
        }
        return response.json();
      })
      .then(function (payload) {
        var groups = payload && payload["menu-groups"] ? payload["menu-groups"] : {};
        var primary = groups.default || {};
        var secondary = groups["secondary-menu"] || groups.secondary || {};
        var base = menuApiBases[brand];
        var primaryItems = getApiMenuItems(primary, fallback.primary);
        var secondaryItems = getApiMenuItems(secondary, fallback.secondary);

        renderApiMenu("default", primaryItems, 7, true);
        renderApiMenu("secondary-menu", secondaryItems, 7);
        renderDrawerQuicklinks(secondaryItems, base);
        renderDrawerCatalog(primaryItems, base);
      })
      .catch(function (error) {
        renderApiMenu("default", fallback.primary, 7, true);
        renderApiMenu("secondary-menu", fallback.secondary, 7);
        qsa("[data-api-menu-status]").forEach(function (status) {
          status.hidden = true;
        });
        console.warn("Unable to load navigation menus", error);
      });
  }

  function applyDeccanHeraldMode(isDh) {
    var root = document.documentElement;
    var body = document.body;
    var publicationToggle = document.querySelector("[data-publication-toggle]");
    var dhLogoUrl = "https://images.assettype.com/deccanherald/2025-08-20/h9a4ohs5/DH-Logo";

    body.classList.toggle("is-dh", isDh);
    root.setAttribute("data-publication", isDh ? "deccan-herald" : "prajavani");
    root.setAttribute("lang", isDh ? "en" : "kn");
    document.title = isDh ? "Deccan Herald" : "ಪ್ರಜಾವಾಣಿ";

    setPublicationCopy(".site-header__primary-premium > span:last-child", ["Premium"], isDh);
    setPublicationCopy(".site-header__utility-link span:last-child", ["Premium", "E-paper", "Sudha", "Mayura"], isDh);
    setPublicationCopy(".site-header__topic-premium > span:last-child, .site-header__topic-epaper > span:last-child, .site-header__topic-premium-extra > span:last-child", ["Premium", "E-paper", "Sudha", "Mayura"], isDh);
    setPublicationCopy(".site-header__subscribe-label", ["Subscribe"], isDh);
    setPublicationCopy(".site-header__epaper .site-header__epaper-label", ["E-paper"], isDh);
    setPublicationCopy(".site-header__mobile-epaper .site-header__epaper-label", ["E-paper"], isDh);
    syncDesktopOfferingLinks(isDh);

    setPublicationCopy(".story__title", [
      "Karnataka Rains: Heavy showers lash Vijayapura district and other parts of the state",
      "Tomato farmers hope for better prices this season",
      "North India sees another wet Sunday as rain continues",
      "Queue for PG accommodation raises questions about safety",
      "Karnataka weather: Major updates as rain activity spreads across the region",
      "Bengaluru roadwork covers 4,800 km across the city",
      "Video: Complete details of the police operation",
      "Fresh debate over the Lok Sabha election; key leaders respond",
      "Bigg Boss Kannada 13: New contestants announced",
      "Internet guide: Essential travel information for airports"
    ], isDh);
    setPublicationCopy(".story__summary", ["Rain moves towards the highways linking the southern and northern districts of Karnataka", "Good yields and better prices bring smiles to farmers"], isDh);
    setPublicationCopy(".feature-card__label, .rail-link", ["More →", "Stay connected for the latest news"], isDh);

    setPublicationCopy(".mobile-bottomnav__item > span:last-child, .mobile-bottomnav__premium-label", ["Home", "Podcast", "Premium", "Menu"], isDh);
    setPublicationCopy(".premium-popup__title > span:last-child, .premium-popup__item > span:last-child", ["Premium", "Premium news", "E-paper", "Sudha", "Mayura"], isDh);

    setPublicationCopy(".drawer__tagline", ["The Kannada Press, Mysuru"], isDh);
    setPublicationCopy(".drawer__quickchip", ["City", "Sports", "Features", "Campus", "Agri Desk"], isDh);
    setPublicationCopy(".drawer__premium-title, .drawer__premium-item > span:last-child, .drawer__premium-cta > span:nth-child(2)", ["Premium Features", "Premium", "E-paper", "Sudha", "Mayura", "Subscribe now for full access"], isDh);
    setPublicationCopy(".drawer-card__title", ["E-paper", "Districts", "News", "Entertainment", "Opinion", "Astrology", "Information", "Columns", "Sports", "Business", "Technology & Auto", "Health & Food", "Education & Careers", "Society", "Arts & Literature", "Agriculture", "Public Voice", "Travel"], isDh);
    setPublicationCopy(".drawer-card__meta", ["Udupi, Uttara Kannada and more", "Politics, national and digital news", "TV, digital and OTT", "Podcasts and discussions", "Horoscopes and panchang", "Explainers and fact checks", "Translation and analysis", "Cricket and leagues", "Budgets and markets", "AI and tech reviews", "Recipes and wellness", "Jobs, exams and guidance", "Festivals, faith and culture", "Books and literature", "Farming, technology and environment", "Election infographics and candidates", "PR spots and itineraries"], isDh);
    setPublicationCopy(".drawer-card__submenu-link", ["Udupi", "Uttara Kannada", "Mysuru", "Politics", "National", "Bengaluru", "Digital", "TV", "Digital", "Hollywood", "Editorial", "Analysis", "Magazine", "Horoscopes", "Panchang", "Vastu", "Explainers", "Fact Check", "Features", "Translation", "Research", "Reviews", "Cricket", "Football", "Kabaddi", "Budget", "Markets", "Startups", "AI", "Gadgets", "Auto", "Health", "Food", "Fitness", "Jobs", "Exams", "Guidance", "Faith", "Tradition", "Culture", "Books", "Literature", "Reviews", "Agriculture", "Environment", "Technology", "Elections", "Candidates", "Infographics", "Destinations", "Itineraries", "Travel Stories"], isDh);
    setPublicationCopy(".drawer__footer-label", ["Follow us", "Contact us"], isDh);
    qsa('.drawer__footer-contact a[href^="mailto:"]').forEach(function (link) {
      var email = isDh ? "support@deccanherald.com" : "support@prajavani.net";
      link.href = "mailto:" + email;
      var label = link.querySelector("span:last-child");
      if (label) {
        label.textContent = email;
      }
    });

    setPublicationAttributes(".site-header__logo, .drawer__brand", "aria-label", ["Deccan Herald home", "Deccan Herald home"], isDh);
    setPublicationAttributes(".site-header__logo-image, .drawer__logo-image", "alt", ["Deccan Herald", "Deccan Herald"], isDh);
    qsa(".site-header__logo-image, .drawer__logo-image").forEach(function (image) {
      if (!image.hasAttribute("data-pv-src")) {
        image.setAttribute("data-pv-src", image.getAttribute("src") || "");
      }
      image.setAttribute("src", isDh ? dhLogoUrl : image.getAttribute("data-pv-src"));
      image.addEventListener("error", function () {
        if (image.getAttribute("src") !== image.getAttribute("data-pv-src")) {
          image.setAttribute("src", image.getAttribute("data-pv-src"));
        }
      }, { once: true });
    });
    setPublicationAttributes(".site-header__search-input, .drawer__searchform-input", "placeholder", ["Search Deccan Herald...", "Search Deccan Herald..."], isDh);
    setPublicationAttributes(".site-header__search-input, .drawer__searchform-input", "aria-label", ["Search", "Search"], isDh);

    if (publicationToggle) {
      publicationToggle.setAttribute("aria-pressed", String(isDh));
      publicationToggle.setAttribute("aria-label", isDh ? "Switch to Prajavani" : "Switch to Deccan Herald");
      var mark = publicationToggle.querySelector(".publication-view-toggle__mark");
      var label = publicationToggle.querySelector(".publication-view-toggle__label");
      if (mark) mark.textContent = isDh ? "PV" : "DH";
      if (label) label.textContent = isDh ? "PV" : "DH";
    }

    loadApiMenus();
  }

  function setBodyLock(locked) {
    document.body.classList.toggle("is-locked", locked);
  }

  function buildIcons() {
    var icons = {
      crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 7l5.5 3L12 5l3.5 5L21 7l-2 9H5zm2-2h10l.7-3.1-2.4 1.4L12 8.5 9.7 12.3 7.3 10.9 7 14z"></path><path d="M7 18h10v2H7z"></path></svg>',
      home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
      mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line><line x1="8" y1="22" x2="16" y2="22"></line></svg>',
      menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
      user: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 0C12.5217 0 13.9517 0.288711 15.29 0.866211C16.6284 1.44371 17.7922 2.22778 18.7822 3.21777C19.7722 4.20777 20.5563 5.37164 21.1338 6.70996C21.7113 8.04829 22 9.47833 22 11C22 12.5217 21.7113 13.9517 21.1338 15.29C20.5563 16.6284 19.7722 17.7922 18.7822 18.7822C17.7922 19.7722 16.6284 20.5563 15.29 21.1338C13.9517 21.7113 12.5217 22 11 22C9.47833 22 8.04829 21.7113 6.70996 21.1338C5.37164 20.5563 4.20777 19.7722 3.21777 18.7822C2.22778 17.7922 1.44371 16.6284 0.866211 15.29C0.288711 13.9517 0 12.5217 0 11C3.01614e-08 9.47833 0.288711 8.04829 0.866211 6.70996C1.44371 5.37164 2.22778 4.20777 3.21777 3.21777C4.20777 2.22778 5.37164 1.44371 6.70996 0.866211C8.04829 0.288711 9.47833 3.01617e-08 11 0ZM11 16.5C10.0284 16.5 9.11163 16.6416 8.25 16.9258C7.38833 17.2099 6.59977 17.6187 5.88477 18.1504C6.59976 18.682 7.38835 19.0899 8.25 19.374C9.11164 19.6582 10.0284 19.7998 11 19.7998C11.9716 19.7998 12.8884 19.6582 13.75 19.374C14.6117 19.0899 15.4002 18.682 16.1152 18.1504C15.4002 17.6187 14.6117 17.2099 13.75 16.9258C12.8884 16.6416 11.9716 16.5 11 16.5ZM11 2.2002C8.56167 2.2002 6.48565 3.05732 4.77148 4.77148C3.05732 6.48565 2.2002 8.56167 2.2002 11C2.2002 12.0817 2.37883 13.0994 2.73633 14.0527C3.09382 15.006 3.59374 15.8587 4.23535 16.6104C5.17034 15.8954 6.21514 15.3314 7.37012 14.9189C8.5251 14.5065 9.73501 14.2998 11 14.2998C12.265 14.2998 13.4749 14.5065 14.6299 14.9189C15.7849 15.3314 16.8297 15.8954 17.7646 16.6104C18.4063 15.8587 18.9062 15.006 19.2637 14.0527C19.6212 13.0994 19.7998 12.0817 19.7998 11C19.7998 8.56167 18.9427 6.48565 17.2285 4.77148C15.5143 3.05732 13.4383 2.2002 11 2.2002ZM11 4.40039C12.0817 4.40039 12.9938 4.77117 13.7363 5.51367C14.4788 6.25617 14.8496 7.16833 14.8496 8.25C14.8496 9.33167 14.4788 10.2438 13.7363 10.9863C12.9938 11.7288 12.0817 12.0996 11 12.0996C9.91833 12.0996 9.00617 11.7288 8.26367 10.9863C7.52117 10.2438 7.15039 9.33167 7.15039 8.25C7.15039 7.16833 7.52117 6.25617 8.26367 5.51367C9.00617 4.77117 9.91833 4.40039 11 4.40039ZM11 6.59961C10.5233 6.59961 10.129 6.75572 9.81738 7.06738C9.50572 7.37905 9.34961 7.77333 9.34961 8.25C9.34961 8.72667 9.50572 9.12095 9.81738 9.43262C10.129 9.74428 10.5233 9.90039 11 9.90039C11.4767 9.90039 11.871 9.74428 12.1826 9.43262C12.4943 9.12095 12.6504 8.72667 12.6504 8.25C12.6504 7.77333 12.4943 7.37905 12.1826 7.06738C11.871 6.75572 11.4767 6.59961 11 6.59961Z" fill="#000"></path></svg>',
      close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      paper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2"></path><path d="M9 6h6"></path><path d="M9 10h6"></path><path d="M9 14h4"></path></svg>',
      book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
      map: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 4.5l-6 2.1-4-1.6A1 1 0 004 5.9v13.2a1 1 0 00.62.92l4.38 1.75 6-2.1 4 1.6a1 1 0 001.38-.92V7.16a1 1 0 00-.62-.92L15 4.5zm-5 15.1l-4-1.5V7.4l4 1.5v10.7zm1-10.7l4-1.4v10.7l-4 1.4V8.9zm9 9.7l-4-1.5V6.4l4 1.5v10.7z"></path></svg>',
      megaphone: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4.5a1 1 0 00-1.56-.83L13.7 7H6a2 2 0 00-2 2v3.5a2 2 0 001.6 1.96l.92 4.6A2 2 0 008.48 21h1.12a2 2 0 001.96-2.39l-.72-3.61h2.86l4.74 3.33A1 1 0 0020 17.5v-13zm-9.76 14.29a.5.5 0 01-.49.61H8.48a.5.5 0 01-.49-.4l-.8-4h2.24l.81 4.05zM18.5 15.57L14 12.4V9.6l4.5-3.17v9.14z"></path></svg>',
      whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.66 15l-1.1 4 4.1-1.08A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.13l-.3-.18-2.43.64.65-2.36-.2-.31A8 8 0 1 1 12 20Zm4.4-5.93c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-1.38-.69-2.28-1.23-3.18-2.78-.24-.41.24-.38.69-1.26.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62 1.52.66 2.12.72 2.88.61.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"></path></svg>',
      facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3c-3.31 0-5 1.69-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.67.33-1 1-1Z"></path></svg>',
      x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h4.8l3.45 4.82L16.2 3H20l-5.95 7.03L20.5 21h-4.8l-3.78-5.28L7.1 21H3.3l6.3-7.48L4 3Zm3.1 2 8.9 14h1.4L8.5 5H7.1Z"></path></svg>',
      instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"></circle></svg>',
      youtube: '<svg viewBox="0 0 30 22" fill="currentColor"><path d="M29.4 3.45a3.7 3.7 0 0 0-2.6-2.6C24.5.2 15 .2 15 .2S5.5.2 3.2.85a3.7 3.7 0 0 0-2.6 2.6C0 5.75 0 11 0 11s0 5.25.6 7.55a3.7 3.7 0 0 0 2.6 2.6c2.3.65 11.8.65 11.8.65s9.5 0 11.8-.65a3.7 3.7 0 0 0 2.6-2.6C30 16.25 30 11 30 11s0-5.25-.6-7.55ZM12 15.9V6.1l8 4.9-8 4.9Z"></path></svg>',
      telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.7 3.3 18.4 20c-.25 1.18-.91 1.47-1.85.92l-5.1-3.76-2.46 2.37c-.27.27-.5.5-1.02.5l.36-5.2 9.47-8.55c.41-.36-.09-.56-.64-.2L5.46 13.57.42 11.99c-1.1-.35-1.12-1.1.23-1.6L20.35 2.8c.91-.34 1.7.2 1.35.5Z"></path></svg>'
      ,mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="1.5"></rect><path d="m4 7 8 6 8-6"></path></svg>'
    };

    icons.loginArrow = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 11 10" fill="none" style="overflow:visible"><path d="M0 4.12509H7.78474L4.73854 1.15503L5.92317 0L11.0002 4.95011L5.92317 9.90022L4.73854 8.74519L7.78474 5.77513H0V4.12509Z" fill="black" stroke="white" stroke-width="3" stroke-linejoin="round" paint-order="stroke"></path></svg>';

    qsa("[data-icon]").forEach(function (element) {
      var iconName = element.getAttribute("data-icon");

      if (iconName === "book" || iconName === "map") {
        element.classList.add("magazine-icon");
        element.innerHTML = "";
        return;
      }

      if (iconName === "paper") {
        element.classList.add("epaper-icon");
        element.innerHTML = "";
        return;
      }

      if (iconName === "crown" || iconName === "nandi") {
        var isProfileBadge =
          element.classList.contains("site-header__profile-badge") ||
          element.classList.contains("drawer__profile-badge") ||
          (element.parentElement &&
            (element.parentElement.classList.contains("site-header__profile-badge") ||
              element.parentElement.classList.contains("drawer__profile-badge")));

        if (document.body.classList.contains("is-subscriber-view") && isProfileBadge) {
          element.classList.add("premium-icon");
          element.classList.remove("premium-profile-icon");
          element.innerHTML = "";
        } else if (!isProfileBadge) {
          element.classList.add("premium-icon");
          element.innerHTML = "";
        } else {
          element.classList.remove("premium-icon");
          element.classList.remove("premium-profile-icon");
          element.innerHTML = icons.crown;
        }
        return;
      }

      var icon = icons[iconName];
      if (icon) {
        element.innerHTML = icon;
      }
    });
  }

  function positionGooNear(trigger) {
    if (!gooBlob) {
      return;
    }

    var rect = trigger.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;

    gooBlob.style.left = centerX - 60 + "px";
    gooBlob.style.top = centerY - 60 + "px";
  }

  function openPremiumPopup(trigger) {
    if (!popup || !gooStage) {
      return;
    }

    positionGooNear(trigger);
    gooStage.classList.remove("is-retract");
    gooStage.classList.add("is-active");

    window.clearTimeout(popupTimer);
    popupTimer = window.setTimeout(function () {
      popup.classList.add("is-open");
      gooStage.classList.add("is-retract");
      setBodyLock(true);
    }, 350);
  }

  function closePremiumPopup() {
    if (!popup || !gooStage) {
      return;
    }

    popup.classList.remove("is-open");
    window.clearTimeout(popupTimer);
    popupTimer = window.setTimeout(function () {
      gooStage.classList.remove("is-active");
      gooStage.classList.remove("is-retract");
      if (!drawer.classList.contains("is-open")) {
        setBodyLock(false);
      }
    }, 220);
  }

  function openDrawer() {
    if (!drawer) {
      return;
    }

    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    setBodyLock(true);
  }

  function closeDrawer() {
    if (!drawer) {
      return;
    }

    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");

    if (!popup.classList.contains("is-open")) {
      setBodyLock(false);
    }
  }

  function closeAllSubmenus() {
    qsa("[data-toggle-submenu]").forEach(function (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    });

    qsa(".drawer-card.is-expanded", drawer).forEach(function (card) {
      card.classList.remove("is-expanded");
    });

    qsa(".drawer-card__submenu", drawer).forEach(function (submenu) {
      submenu.classList.remove("is-expanded");
    });

    updateDesktopDrawerGrid();
  }

  function updateDesktopDrawerGrid() {
    var catalog = document.querySelector(".drawer__catalog");
    if (!catalog) {
      return;
    }

    var cards = Array.prototype.slice.call(catalog.querySelectorAll(":scope > .drawer-card"));
    var expandedIndex = cards.findIndex(function (card) {
      return card.classList.contains("is-expanded");
    });

    if (expandedIndex < 0) {
      catalog.classList.remove("has-expanded-card");
      cards.forEach(function (card) {
        card.style.removeProperty("--drawer-grid-column");
        card.style.removeProperty("--drawer-grid-row");
        card.style.removeProperty("--drawer-submenu-row");
      });
      return;
    }

    var expandedRow = Math.floor(expandedIndex / 3) + 1;
    catalog.classList.add("has-expanded-card");
    cards.forEach(function (card, index) {
      var baseRow = Math.floor(index / 3) + 1;
      var row = baseRow + (baseRow > expandedRow ? 1 : 0);
      card.style.setProperty("--drawer-grid-column", String((index % 3) + 1));
      card.style.setProperty("--drawer-grid-row", String(row));
      card.style.setProperty("--drawer-submenu-row", String(expandedRow + 1));
    });
  }

  function toggleSubmenu(toggle) {
    var submenuId = toggle.getAttribute("aria-controls");
    var submenu = submenuId ? document.getElementById(submenuId) : null;
    var expanded = toggle.getAttribute("aria-expanded") === "true";

    if (!submenu) {
      return;
    }

    qsa("[data-toggle-submenu]", drawer).forEach(function (button) {
      if (button !== toggle) {
        button.setAttribute("aria-expanded", "false");
      }
    });

    qsa(".drawer-card__submenu", drawer).forEach(function (panel) {
      if (panel !== submenu) {
        panel.classList.remove("is-expanded");
      }
    });

    qsa(".drawer-card.is-expanded", drawer).forEach(function (card) {
      if (card !== toggle.closest(".drawer-card")) {
        card.classList.remove("is-expanded");
      }
    });

    toggle.setAttribute("aria-expanded", String(!expanded));
    submenu.classList.toggle("is-expanded", !expanded);
    var card = toggle.closest(".drawer-card");
    if (card) {
      card.classList.toggle("is-expanded", !expanded);
    }
    updateDesktopDrawerGrid();
  }

  function preventSearchSubmit() {
    qsa('form[role="search"]').forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
      });
    });
  }

  function updateCompactHeader() {
    if (!siteHeader || desktopBreakpoint.matches) {
      return;
    }

    var currentScrollY = window.scrollY;
    var currentScrollAt = Date.now();
    var subscriberView = document.body.classList.contains("is-subscriber-view");
    var movingDown = currentScrollY > lastScrollY;
    var movingUp = currentScrollY < lastScrollY;
    var scrollingDown = currentScrollY > lastScrollY + 4;
    var scrollingUp = currentScrollY < lastScrollY - 4;
    var fastUpwardGesture = false;

    if (movingDown || currentScrollY <= 8) {
      upwardBurstActive = false;
      upwardBurstCount = 0;
      upwardBurstStartedAt = 0;
      window.clearTimeout(upwardBurstResetTimer);
    } else if (movingUp) {
      if (!upwardBurstActive) {
        if (!upwardBurstStartedAt || currentScrollAt - upwardBurstStartedAt > 600) {
          upwardBurstCount = 0;
          upwardBurstStartedAt = currentScrollAt;
        }

        upwardBurstCount += 1;
        upwardBurstActive = true;

        if (upwardBurstCount >= 2) {
          fastUpwardGesture = true;
          upwardBurstCount = 0;
          upwardBurstStartedAt = 0;
        }
      }

      window.clearTimeout(upwardBurstResetTimer);
      upwardBurstResetTimer = window.setTimeout(function () {
        upwardBurstActive = false;
      }, 100);
    }

    if (subscriberView) {
      if (currentScrollY <= 8) {
        window.clearTimeout(subscriberBottomRevealTimer);
        siteHeader.classList.remove("is-compact");
        siteHeader.classList.remove("is-menu-hidden");
        siteHeader.classList.remove("is-utility-hidden");
        document.body.classList.remove("is-subscriber-bottom-hidden");
      } else if (fastUpwardGesture) {
        window.clearTimeout(subscriberBottomRevealTimer);
        siteHeader.classList.remove("is-compact");
        siteHeader.classList.remove("is-menu-hidden");
        siteHeader.classList.remove("is-utility-hidden");
        document.body.classList.remove("is-subscriber-bottom-hidden");
      } else if (scrollingDown) {
        window.clearTimeout(subscriberBottomRevealTimer);
        siteHeader.classList.add("is-compact");
        siteHeader.classList.remove("is-menu-hidden");
        siteHeader.classList.add("is-utility-hidden");
        document.body.classList.add("is-subscriber-bottom-hidden");
      } else if (scrollingUp) {
        window.clearTimeout(subscriberBottomRevealTimer);
        siteHeader.classList.add("is-compact");
        siteHeader.classList.remove("is-menu-hidden");
        siteHeader.classList.add("is-utility-hidden");
        document.body.classList.remove("is-subscriber-bottom-hidden");
      }

      if (currentScrollY > 8) {
        window.clearTimeout(subscriberBottomRevealTimer);
        subscriberBottomRevealTimer = window.setTimeout(function () {
          document.body.classList.remove("is-subscriber-bottom-hidden");
        }, 3000);
      }
    } else if (currentScrollY <= 8 || scrollingUp) {
      window.clearTimeout(subscriberBottomRevealTimer);
      siteHeader.classList.remove("is-compact");
      document.body.classList.remove("is-subscriber-bottom-hidden");
      document.body.classList.remove("is-nonsubscriber-bottom-hidden");
    } else if (scrollingDown) {
      window.clearTimeout(subscriberBottomRevealTimer);
      siteHeader.classList.add("is-compact");
      document.body.classList.remove("is-subscriber-bottom-hidden");
      document.body.classList.add("is-nonsubscriber-bottom-hidden");
      subscriberBottomRevealTimer = window.setTimeout(function () {
        document.body.classList.remove("is-nonsubscriber-bottom-hidden");
      }, 3000);
    }

    lastScrollY = currentScrollY;
    lastScrollAt = currentScrollAt;
    if (scrollingUp) {
      lastScrollDirection = "up";
    } else if (scrollingDown) {
      lastScrollDirection = "down";
    }
  }

  function bindScrollBehavior() {
    window.addEventListener("scroll", updateCompactHeader, { passive: true });
  }

  function bindEvents() {
    document.body.addEventListener("click", function (event) {
      var premiumTrigger = event.target.closest("[data-premium-badge]");
      var drawerTrigger = event.target.closest("[data-open-drawer]");
      var closeDrawerTrigger = event.target.closest("[data-close-drawer]");
      var closePopupTrigger = event.target.closest("[data-close-popup]");
      var submenuToggle = event.target.closest("[data-toggle-submenu]");
      var subscriberToggle = event.target.closest("[data-subscriber-toggle]");
      var publicationToggle = event.target.closest("[data-publication-toggle]");
      var profileTrigger = event.target.closest(".site-header__profile, .drawer__profile");

      if (premiumTrigger) {
        event.preventDefault();
        openPremiumPopup(premiumTrigger);
        return;
      }

      if (subscriberToggle) {
        event.preventDefault();
        var isSubscriberView = subscriberToggle.getAttribute("aria-pressed") === "true";
        subscriberToggle.setAttribute("aria-pressed", String(!isSubscriberView));
        document.body.classList.toggle("is-subscriber-view", !isSubscriberView);
        if (!isSubscriberView) {
          qsa(".site-header__profile, .drawer__profile").forEach(function (profileTrigger) {
            profileTrigger.classList.remove("is-login");
            profileTrigger.setAttribute("aria-pressed", "false");
            var loginArrow = profileTrigger.querySelector('[data-icon="loginArrow"]');
            if (loginArrow) {
              loginArrow.remove();
            }
          });
        }
        buildIcons();
        document.body.classList.remove("is-subscriber-bottom-hidden");
        document.body.classList.remove("is-nonsubscriber-bottom-hidden");
        window.clearTimeout(subscriberBottomRevealTimer);
        siteHeader.classList.remove("is-compact");
        siteHeader.classList.remove("is-menu-hidden");
        siteHeader.classList.remove("is-utility-hidden");
        return;
      }

      if (publicationToggle) {
        event.preventDefault();
        var isDh = publicationToggle.getAttribute("aria-pressed") === "true";
        applyDeccanHeraldMode(!isDh);
        return;
      }

      if (profileTrigger) {
        event.preventDefault();
        if (document.body.classList.contains("is-subscriber-view")) {
          return;
        }
        var isLoginVariant = profileTrigger.classList.toggle("is-login");
        profileTrigger.setAttribute("aria-pressed", String(isLoginVariant));
        var loginArrow = profileTrigger.querySelector('[data-icon="loginArrow"]');
        if (isLoginVariant && !loginArrow) {
          loginArrow = document.createElement("span");
          loginArrow.className = "profile-login-arrow";
          loginArrow.setAttribute("data-icon", "loginArrow");
          loginArrow.setAttribute("aria-hidden", "true");
          profileTrigger.appendChild(loginArrow);
        } else if (!isLoginVariant && loginArrow) {
          loginArrow.remove();
        }
        buildIcons();
        return;
      }

      if (drawerTrigger) {
        event.preventDefault();
        openDrawer();
        return;
      }

      if (closeDrawerTrigger) {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (closePopupTrigger) {
        event.preventDefault();
        closePremiumPopup();
        return;
      }

      if (submenuToggle) {
        event.preventDefault();
        toggleSubmenu(submenuToggle);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeDrawer();
        closePremiumPopup();
      }
    });

    desktopBreakpoint.addEventListener("change", function () {
      closeDrawer();
      closeAllSubmenus();
      siteHeader.classList.remove("is-compact");
      siteHeader.classList.remove("is-menu-hidden");
      siteHeader.classList.remove("is-utility-hidden");
      document.body.classList.remove("is-subscriber-bottom-hidden");
      document.body.classList.remove("is-nonsubscriber-bottom-hidden");
    });
  }

  function init() {
    buildIcons();
    preventSearchSubmit();
    bindEvents();
    bindScrollBehavior();
    loadApiMenus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
