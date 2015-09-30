'use strict';
var app = angular.module("gw2pricer", []);

app.filter('gw2Currency', function() {
    return function(price) {
        var priceStr = price.toString();
        var priceArr = priceStr.split(''); //split price into array and add 'c' (copper) to end
        priceArr.push('c');
        if (priceStr.length > 2) {
            //greater than 1 s
            priceArr.splice(-3, 0, 's ')
        }
        if (priceStr.length > 4) {
            //greater than 1 g
            priceArr.splice(-6, 0, 'g ');
        }
        return priceArr.join('');
    };
});

app.controller("gw2Controller", function($scope, $filter, $q) {
    $scope.priceFull = {};
    $scope.currItem = {};
    $scope.recipeShow = false;
    $scope.quantLim = 500;
    $scope.refreshPrices = function() {
        var priceObj = {};
        $.getJSON('https://api.guildwars2.com/v2/commerce/prices?ids=24329,24330,24324,24325,24339,24340,24334,24335,24304,24305,24309,24310,24314,24315,24319,24320', function(data) {
            data.forEach(function(el) {
                priceObj[el.id] = {
                    name: '',
                    price: parseInt(el.sells.unit_price),
                    itId: el.id,
                    isCore: '',
                    pic: ''
                };
            })
            $.getJSON('https://api.guildwars2.com/v2/items?ids=24329,24330,24324,24325,24339,24340,24334,24335,24304,24305,24309,24310,24314,24315,24319,24320', function(data) {
                data.forEach(function(el) {
                    priceObj[el.id].name = el.name;
                    priceObj[el.id].pic = el.icon;
                    if (el.name.indexOf('Core') != -1 || el.name.indexOf('Vile') != -1) {
                        //item is a core, so calc upg cost
                        var upgCost = 2504 + (2 * priceObj[el.id].price) + 1792; //cost of upgrading
                        var upgProf = priceObj[el.id + 1].price - upgCost;
                        priceObj[el.id].upg = upgProf;
                    } else {
                        priceObj[el.id].isCore = 'none';
                    }
                })
                console.log('From factory: ', priceObj)
                angular.copy(priceObj, $scope.priceFull);
                $scope.$apply();

            });
        })
    }
    $scope.refreshPrices();
    $scope.alertMe = function() {
        console.log($scope.priceFull)
    }
    $scope.recipeList = [];
    $scope.getRecipes = function(item) {
        $scope.recipeList = [];
        console.log(item);
        $scope.recipeShow = true;
        $scope.currItem = item;
        //now, get list of recipes from gw2 APi
        $.get('https://api.guildwars2.com/v2/recipes/search?input=' + item.itId, function(res) {
            var promList = [];
            res.forEach(function(resNum) {
                promList.push($.get('https://api.guildwars2.com/v2/recipes/' + resNum));
            });
            $q.all(promList).then(function(recipes) {
                var recipeString = '';
                console.log('recipes', recipes)
                recipes.forEach(function(priceItem) {
                    recipeString += priceItem.output_item_id + ',';
                })
                recipeString = recipeString.substring(0, recipeString.length - 1);
                $.get('https://api.guildwars2.com/v2/commerce/prices?ids=' + recipeString, function(itemRecipePrices) {
                    itemRecipePrices.sort(function(a, b) {
                        if (a.sells.unit_price > b.sells.unit_price) {
                            return -1;
                        } else if (a.sells.unit_price > b.sells.unit_price) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                    console.log('item recipe prices', itemRecipePrices)
                    itemRecipePrices.forEach(function(theItem) {
                            var quant = 0;
                            var whichRecipe = 0;
                            for (var n = 0; n < recipes.length; n++) {
                                //loop thru and find the recipe this item belongs to 
                                if (recipes[n].output_item_id == theItem.id) {
                                    whichRecipe = n;
                                    for (var q = 0; q < recipes[n].ingredients.length; q++) {
                                        //loop the ingreds and find the original item
                                        if (recipes[n].ingredients[q].item_id == item.itId) {
                                            quant = parseInt(recipes[n].ingredients[q].count);
                                        }
                                    }
                                }
                            }
                            $.get('https://api.guildwars2.com/v2/items/' + recipes[whichRecipe].output_item_id, function(finalRecip) {
                                $scope.recipeList.push({
                                    price: theItem.sells.unit_price,
                                    quantity: quant,
                                    name: finalRecip.name
                                })
                                $scope.$digest();
                            })
                        })
                        /*for every item obtained in the itemRecipePrices list, we need to construct an object with:
                        itemPrice: itemRecipeList[i].sells.unit_price
                        quantity: corresponding quantity from recipes
                        name: name of item (need another get?)
                        */
                })
            })
        })
    };
    $scope.quanFilt = function(itemQuant) {
        console.log(itemQuant, typeof itemQuant, $scope.quantLim, typeof $scope.quantLim)
        if (itemQuant <= $scope.quantLim) {
            return true;
        } else {
            return false;
        }
    };
    $(function() {
        $('.draggable').draggable({
            // containment: [0, 0, $(document).width() / 2, $(document).height() / 2]
        });
    });
    $scope.sort='name';
    $scope.reverse=false;
    $scope.sortRec = function(value) {
        if ($scope.sort == value) {
            $scope.reverse = !$scope.reverse;
            return;
        }

        $scope.sort = value;
        $scope.reverse = false;
    }
});
