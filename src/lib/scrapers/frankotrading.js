var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, tries: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.tries.pop(); continue;
                default:
                    if (!(t = _.tries, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.tries.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var puppeteer = require('puppeteer');
var FrankoTradingScraper = /** @class */ (function () {
    function FrankoTradingScraper() {
        this.baseUrl = 'https://frankotrading.com';
        this.store = 'Franko Trading';
        this.currency = 'GHS';
        this.maxRetries = 3;
        this.navigationTimeout = 60000; // 60s timeout
    }
    FrankoTradingScraper.prototype.delay = function (ms) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
            });
        });
    };
    FrankoTradingScraper.prototype.calculateRelevancyScore = function (title, query) {
        var titleWords = title.toLowerCase().split(/\s+/);
        var queryWords = query.toLowerCase().split(/\s+/);
        var score = 0;
        var _loop_1 = function (queryWord) {
            if (titleWords.some(function (word) { return word.includes(queryWord) || queryWord.includes(word); })) {
                score += 1;
            }
        };
        for (var _i = 0, queryWords_1 = queryWords; _i < queryWords_1.length; _i++) {
            var queryWord = queryWords_1[_i];
            _loop_1(queryWord);
        }
        return Math.min(1, score / queryWords.length);
    };
    FrankoTradingScraper.prototype.configurePage = function (page) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, page.setDefaultNavigationTimeout(this.navigationTimeout)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, page.setViewport({ width: 1920, height: 1080 })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, page.setExtraHTTPHeaders({
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                                'Accept-Language': 'en-US,en;q=0.9',
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache',
                                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
                                'Sec-Ch-Ua-Mobile': '?0',
                                'Sec-Ch-Ua-Platform': '"Windows"'
                            })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    FrankoTradingScraper.prototype.getSearchUrl = function (query) {
        return "".concat(this.baseUrl, "/catalogsearch/result/?q=").concat(encodeURIComponent(query));
    };
    FrankoTradingScraper.prototype.getSearchResults = function (page, minBudget, maxBudget) {
        return __awaiter(this, void 0, void 0, function () {
            var rawProducts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Wait for products container or no results message
                    return [4 /*yield*/, Promise.race([
                            page.waitForSelector('.products.list.items.product-items', { timeout: this.navigationTimeout }),
                            page.waitForSelector('.message.notice', { timeout: this.navigationTimeout })
                        ])];
                    case 1:
                        // Wait for products container or no results message
                        _a.sent();
                        return [4 /*yield*/, page.evaluate(function (minBudget, maxBudget) {
                                var items = document.querySelectorAll('.item.product.product-item');
                                console.log("[FrankoTradingScraper Browser] Found ".concat(items.length, " product items"));
                                return Array.from(items).map(function (item) {
                                    var _a, _b, _c;
                                    try {
                                        var titleEl = item.querySelector('.product-item-link');
                                        var priceEl = item.querySelector('.price');
                                        var linkEl = item.querySelector('.product-item-link');
                                        var imgEl = item.querySelector('.product-image-photo');
                                        if (!titleEl || !priceEl || !linkEl) {
                                            console.log('[FrankoTradingScraper Browser] Missing required elements');
                                            return null;
                                        }
                                        var title = ((_a = titleEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                                        var priceText = ((_b = priceEl.textContent) === null || _b === void 0 ? void 0 : _b.replace(/[^0-9.]/g, '')) || '';
                                        var price = parseFloat(priceText);
                                        var productUrl = linkEl.getAttribute('href') || '';
                                        var imageUrl = (imgEl === null || imgEl === void 0 ? void 0 : imgEl.getAttribute('src')) || '';
                                        console.log('[FrankoTradingScraper Browser] Processing product:', {
                                            title: title.substring(0, 50),
                                            price: price,
                                            hasUrl: !!productUrl,
                                            hasImage: !!imageUrl
                                        });
                                        if (!title || !price || !productUrl)
                                            return null;
                                        if (minBudget && price < minBudget)
                                            return null;
                                        if (maxBudget && price > maxBudget)
                                            return null;
                                        return {
                                            title: title,
                                            price: price,
                                            priceFormatted: ((_c = priceEl.textContent) === null || _c === void 0 ? void 0 : _c.trim()) || '',
                                            productUrl: productUrl,
                                            imageUrl: imageUrl || '/placeholder.png'
                                        };
                                    }
                                    catch (error) {
                                        console.error('[FrankoTradingScraper Browser] Error processing item:', error);
                                        return null;
                                    }
                                }).filter(Boolean);
                            }, minBudget, maxBudget)];
                    case 2:
                        rawProducts = _a.sent();
                        console.log("[FrankoTradingScraper] Found ".concat(rawProducts.length, " valid products"));
                        return [2 /*return*/, rawProducts];
                }
            });
        });
    };
    FrankoTradingScraper.prototype.scrape = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var query, minBudget, maxBudget, browser, retryCount, page, searchUrl, response, products, processedProducts, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = request.query, minBudget = request.minBudget, maxBudget = request.maxBudget;
                        browser = null;
                        retryCount = 0;
                        _a.label = 1;
                    case 1:
                        if (!(retryCount < this.maxRetries)) return [3 /*break*/, 16];
                        _a.label = 2;
                    case 2:
                        _a.tries.push([2, 10, , 15]);
                        return [4 /*yield*/, puppeteer.launch({
                                headless: 'new',
                                args: [
                                    '--no-sandbox',
                                    '--disable-setuid-sandbox',
                                    '--disable-dev-shm-usage',
                                    '--disable-accelerated-2d-canvas',
                                    '--disable-gpu',
                                    '--window-size=1920,1080'
                                ]
                            })];
                    case 3:
                        browser = _a.sent();
                        return [4 /*yield*/, browser.newPage()];
                    case 4:
                        page = _a.sent();
                        return [4 /*yield*/, this.configurePage(page)];
                    case 5:
                        _a.sent();
                        searchUrl = this.getSearchUrl(query);
                        console.log("[FrankoTradingScraper] Accessing search URL: ".concat(searchUrl));
                        return [4 /*yield*/, page.goto(searchUrl, {
                                waitUntil: 'networkidle0',
                                timeout: this.navigationTimeout
                            })];
                    case 6:
                        response = _a.sent();
                        if (!(response === null || response === void 0 ? void 0 : response.ok())) {
                            throw new Error("Failed to load page: ".concat(response === null || response === void 0 ? void 0 : response.status(), " ").concat(response === null || response === void 0 ? void 0 : response.statusText()));
                        }
                        // Add a small delay to ensure dynamic content is loaded
                        return [4 /*yield*/, this.delay(2000)];
                    case 7:
                        // Add a small delay to ensure dynamic content is loaded
                        _a.sent();
                        return [4 /*yield*/, this.getSearchResults(page, minBudget, maxBudget)];
                    case 8:
                        products = _a.sent();
                        return [4 /*yield*/, browser.close()];
                    case 9:
                        _a.sent();
                        browser = null;
                        if (products.length === 0) {
                            console.log('[FrankoTradingScraper] No products found');
                            return [2 /*return*/, { success: true, products: [], error: null }];
                        }
                        processedProducts = products.map(function (item) { return ({
                            id: "frankotrading-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)),
                            title: item.title,
                            price: item.price,
                            currency: _this.currency,
                            productUrl: item.productUrl,
                            imageUrl: item.imageUrl,
                            store: _this.store,
                            rating: null,
                            reviews: null,
                            availability: true,
                            metadata: {
                                searchQuery: query,
                                originalPrice: item.priceFormatted,
                                relevancyScore: _this.calculateRelevancyScore(item.title, query)
                            }
                        }); });
                        console.log("[FrankoTradingScraper] Successfully processed ".concat(processedProducts.length, " products"));
                        return [2 /*return*/, { success: true, products: processedProducts, error: null }];
                    case 10:
                        error_1 = _a.sent();
                        console.error("[FrankoTradingScraper] Error during attempt ".concat(retryCount + 1, ":"), error_1);
                        if (!browser) return [3 /*break*/, 12];
                        return [4 /*yield*/, browser.close()];
                    case 11:
                        _a.sent();
                        browser = null;
                        _a.label = 12;
                    case 12:
                        retryCount++;
                        if (!(retryCount < this.maxRetries)) return [3 /*break*/, 14];
                        console.log("[FrankoTradingScraper] Retrying... (".concat(retryCount, "/").concat(this.maxRetries, ")"));
                        return [4 /*yield*/, this.delay(2000 * retryCount)];
                    case 13:
                        _a.sent(); // Exponential backoff
                        _a.label = 14;
                    case 14: return [3 /*break*/, 15];
                    case 15: return [3 /*break*/, 1];
                    case 16: return [2 /*return*/, {
                            success: false,
                            products: [],
                            error: "Failed after ".concat(this.maxRetries, " attempts")
                        }];
                }
            });
        });
    };
    return FrankoTradingScraper;
}());
module.exports = { FrankoTradingScraper: FrankoTradingScraper };
