'use strict';
var app = angular.module("gw2pricer", []);

app.filter('gw2Currency', function () {
  return function (price) {
  	var priceStr = price.toString();
  	var priceArr = priceStr.split('');//split price into array and add 'c' (copper) to end
  	priceArr.push('c');
  	if (priceStr.length>2){
  		//greater than 1 s
  		priceArr.splice(-3,0,'s ')
  	}
 	if (priceStr.length>4){
 		//greater than 1 g
 		priceArr.splice(-6,0,'g ');
 	}
  	return priceArr.join('');
  };
});

app.controller("gw2Controller", function($scope,$filter) {
    $scope.priceFull = {};
    $scope.refreshPrices = function() {
    	var priceObj={};
        $.getJSON('https://api.guildwars2.com/v2/commerce/prices?ids=24329,24330,24324,24325,24339,24340,24334,24335,24304,24305,24309,24310,24314,24315,24319,24320', function(data) {
            data.forEach(function(el) {
                priceObj[el.id] = {
                    name: '',
                    price: parseInt(el.sells.unit_price),
                    itId : el.id,
                    isCore : '',
                    pic:''
                };
            })
            $.getJSON('https://api.guildwars2.com/v2/items?ids=24329,24330,24324,24325,24339,24340,24334,24335,24304,24305,24309,24310,24314,24315,24319,24320', function(data) {
                data.forEach(function(el) {
                    priceObj[el.id].name = el.name;
                    priceObj[el.id].pic = el.icon;
                    if(el.name.indexOf('Core')!=-1 || el.name.indexOf('Vile')!=-1){
                    	//item is a core, so calc upg cost
                    	var upgCost = 2504 + (2*priceObj[el.id].price)+1792;//cost of upgrading
                    	var upgProf = priceObj[el.id+1].price - upgCost;
                    	priceObj[el.id].upg = upgProf;
                    } else {
                    	priceObj[el.id].isCore = 'none';
                    }
                })
                console.log('From factory: ',priceObj)
                angular.copy(priceObj,$scope.priceFull); 
                $scope.$apply();

            });
        })
    }
    $scope.refreshPrices();
    $scope.alertMe = function() {
        console.log($scope.priceFull)
    }
});
