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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
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
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var puppeteer = require('puppeteer');
var JumiaScraper = /** @class */ (function () {
    function JumiaScraper() {
        this.baseUrl = 'https://jumia.com.gh';
        this.store = 'Jumia';
        this.currency = 'GHS';
        this.accessoryTerms = [
            'case', 'cover', 'screen', 'protector', 'charger', 'cable',
            'adapter', 'airpod', 'earpod', 'headphone', 'stand', 'holder',
            'mount', 'pen', 'stylus', 'skin', 'sticker', 'film', 'glass',
            'battery', 'power bank', 'dock', 'wallet', 'card', 'grip',
            'ring', 'remote', 'selfie', 'stick', 'tripod', 'monopod',
            'flash drive', 'pendrive', 'usb', 'memory stick', 'otg'
        ];
    }
    JumiaScraper.prototype.isAccessory = function (title) {
        var lowerTitle = title.toLowerCase();
        return this.accessoryTerms.some(function (term) { return lowerTitle.includes(term); });
    };
    JumiaScraper.prototype.calculateRelevancyScore = function (title, searchTerms) {
        var titleWords = title.toLowerCase().split(/\s+/);
        var matchCount = 0;
        var _loop_1 = function (term) {
            if (titleWords.some(function (word) { return word.includes(term); })) {
                matchCount++;
            }
        };
        for (var _i = 0, searchTerms_1 = searchTerms; _i < searchTerms_1.length; _i++) {
            var term = searchTerms_1[_i];
            _loop_1(term);
        }
        return matchCount / searchTerms.length;
    };
    JumiaScraper.prototype.extractProductInfo = function (page, searchTerms) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, page.evaluate(function (searchTerms) {
                        var items = document.querySelectorAll('article.prd');
                        console.log("[JumiaScraper] Found ".concat(items.length, " raw products"));
                        function calculateRelevancyScore(title, searchTerms) {
                            var titleWords = title.toLowerCase().split(/\s+/);
                            var matchCount = 0;
                            var _loop_2 = function (term) {
                                if (titleWords.some(function (word) { return word.includes(term); })) {
                                    matchCount++;
                                }
                            };
                            for (var _i = 0, searchTerms_2 = searchTerms; _i < searchTerms_2.length; _i++) {
                                var term = searchTerms_2[_i];
                                _loop_2(term);
                            }
                            return matchCount / searchTerms.length;
                        }
                        function isAccessory(title) {
                            var accessoryTerms = [
                                'case', 'cover', 'screen', 'protector', 'charger', 'cable',
                                'adapter', 'airpod', 'earpod', 'headphone', 'stand', 'holder',
                                'mount', 'pen', 'stylus', 'skin', 'sticker', 'film', 'glass',
                                'battery', 'power bank', 'dock', 'wallet', 'card', 'grip',
                                'ring', 'remote', 'selfie', 'stick', 'tripod', 'monopod',
                                'flash drive', 'pendrive', 'usb', 'memory stick', 'otg'
                            ];
                            var lowerTitle = title.toLowerCase();
                            return accessoryTerms.some(function (term) { return lowerTitle.includes(term); });
                        }
                        return Array.from(items).map(function (item) {
                            // Get the main product link
                            var linkElement = item.querySelector('a.core');
                            var productUrl = (linkElement === null || linkElement === void 0 ? void 0 : linkElement.getAttribute('href')) || '';
                            // Get product title
                            var titleElement = item.querySelector('h3.name') || item.querySelector('[name="title"]');
                            var rawTitle = (titleElement === null || titleElement === void 0 ? void 0 : titleElement.textContent) || '';
                            var title = rawTitle.replace(/\s*-\s*Sponsored\s*$/, '').trim();
                            // Get price
                            var priceElement = item.querySelector('.prc');
                            var priceText = (priceElement === null || priceElement === void 0 ? void 0 : priceElement.textContent) || '';
                            var price = parseFloat(priceText.replace(/[^\d.]/g, ''));
                            // Get image URL
                            var imgElement = item.querySelector('img.img');
                            var imageUrl = (imgElement === null || imgElement === void 0 ? void 0 : imgElement.getAttribute('data-src')) ||
                                (imgElement === null || imgElement === void 0 ? void 0 : imgElement.getAttribute('src')) || '';
                            // Calculate relevancy score
                            var relevancyScore = calculateRelevancyScore(title, searchTerms);
                            var isAccessoryProduct = isAccessory(title);
                            console.log("[JumiaScraper] Processing product: ".concat(title));
                            console.log("[JumiaScraper] Relevancy score: ".concat(relevancyScore));
                            console.log("[JumiaScraper] Is accessory: ".concat(isAccessoryProduct));
                            return {
                                title: title,
                                price: price,
                                currency: 'GHS',
                                store: 'Jumia',
                                productUrl: "https://jumia.com.gh".concat(productUrl),
                                imageUrl: imageUrl,
                                metadata: {
                                    relevancyScore: relevancyScore,
                                    isAccessory: isAccessoryProduct
                                }
                            };
                        });
                    }, searchTerms)];
            });
        });
    };
    JumiaScraper.prototype.scrape = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var browser, searchTerms, page, url, error_1, content, products, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 11, 12, 15]);
                        console.log("[JumiaScraper] Starting search for: ".concat(request.query));
                        searchTerms = request.query.toLowerCase().split(' ');
                        console.log("[JumiaScraper] Search terms:", searchTerms);
                        return [4 /*yield*/, puppeteer.launch({
                                headless: true,
                                args: [
                                    '--no-sandbox',
                                    '--disable-setuid-sandbox',
                                    '--disable-dev-shm-usage',
                                    '--window-size=1920x1080'
                                ]
                            })];
                    case 1:
                        browser = _a.sent();
                        return [4 /*yield*/, browser.newPage()];
                    case 2:
                        page = _a.sent();
                        // Set longer timeout
                        page.setDefaultNavigationTimeout(30000);
                        page.setDefaultTimeout(30000);
                        // Set user agent
                        return [4 /*yield*/, page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')];
                    case 3:
                        // Set user agent
                        _a.sent();
                        url = "".concat(this.baseUrl, "/catalog/?q=").concat(encodeURIComponent(request.query));
                        console.log("[JumiaScraper] Navigating to: ".concat(url));
                        return [4 /*yield*/, page.goto(url, {
                                waitUntil: 'networkidle0',
                                timeout: 30000
                            })];
                    case 4:
                        _a.sent();
                        console.log('[JumiaScraper] Page loaded, waiting for products...');
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 9]);
                        return [4 /*yield*/, page.waitForSelector('article.prd', { timeout: 20000 })];
                    case 6:
                        _a.sent();
                        console.log('[JumiaScraper] Found product elements');
                        return [3 /*break*/, 9];
                    case 7:
                        error_1 = _a.sent();
                        console.log('[JumiaScraper] No product elements found:', error_1);
                        return [4 /*yield*/, page.content()];
                    case 8:
                        content = _a.sent();
                        console.log('[JumiaScraper] Page content length:', content.length);
                        return [2 /*return*/, {
                                success: true,
                                products: [],
                                error: null
                            }];
                    case 9: return [4 /*yield*/, this.extractProductInfo(page, searchTerms)];
                    case 10:
                        products = _a.sent();
                        console.log("[JumiaScraper] Extracted ".concat(products.length, " raw products"));
                        // Filter and sort products
                        products = products
                            .filter(function (product) {
                            var _a, _b, _c, _d;
                            var isRelevant = ((_a = product.metadata) === null || _a === void 0 ? void 0 : _a.relevancyScore) >= 0.7;
                            var isNotAccessory = !((_b = product.metadata) === null || _b === void 0 ? void 0 : _b.isAccessory);
                            console.log("[JumiaScraper] Product \"".concat(product.title, "\": relevancy=").concat((_c = product.metadata) === null || _c === void 0 ? void 0 : _c.relevancyScore, ", isAccessory=").concat((_d = product.metadata) === null || _d === void 0 ? void 0 : _d.isAccessory));
                            return isRelevant && isNotAccessory;
                        })
                            .sort(function (a, b) { var _a, _b; return (((_a = b.metadata) === null || _a === void 0 ? void 0 : _a.relevancyScore) || 0) - (((_b = a.metadata) === null || _b === void 0 ? void 0 : _b.relevancyScore) || 0); });
                        console.log("[JumiaScraper] Found ".concat(products.length, " relevant products"));
                        return [2 /*return*/, {
                                success: true,
                                products: products,
                                error: null
                            }];
                    case 11:
                        error_2 = _a.sent();
                        console.error('[JumiaScraper] Error:', error_2);
                        return [2 /*return*/, {
                                success: false,
                                products: [],
                                error: error_2 instanceof Error ? error_2.message : 'Unknown error occurred'
                            }];
                    case 12:
                        if (!browser) return [3 /*break*/, 14];
                        return [4 /*yield*/, browser.close()];
                    case 13:
                        _a.sent();
                        _a.label = 14;
                    case 14: return [7 /*endfinally*/];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    return JumiaScraper;
}());
module.exports = { JumiaScraper: JumiaScraper };
