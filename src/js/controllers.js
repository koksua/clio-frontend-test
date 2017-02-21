'use strict';

/* Controllers */

var myApp = angular.module('myApp', ['slick', 'ngCookies']);

myApp.service( 'cartModel', ['$cookies', function( $cookies ){
    var cart = {};
    var storeData = null;//$cookies.get('myCart');
    var store = ( storeData ) ? JSON.parse( storeData ) : {};

    cart.cartAdd = function( product, quantity ) {
        if ( !(product && product.id) ) {
            return false;
        }
        if ( store[product.id] ) {
            var upFromCart = 1;
            $cookies.put('myCart', JSON.stringify( store ) );
            return this.updateQty( product.id, quantity, upFromCart );
        }
        store[product.id] = {
            id : product.id,
            quantity : quantity,
            title : product.title,
            price : product.price,
            oldQuantity : product.quantity
        };

        $cookies.put('myCart', JSON.stringify( store ) );
    };

    cart.updateQty = function( productId, quantity, upFromCart ) {
        if( quantity <= 0 ) {
            delete store[productId];
            $cookies.put('myCart', JSON.stringify( store ) );
            return false;
        }
        if( upFromCart ) {
            store[productId].quantity += quantity;
        }
        else {
            store[productId].quantity = quantity;
        }

        $cookies.put('myCart', JSON.stringify( store ) );

    };

    cart.showStore = function() {
        return store;
    };

    cart.total = function() {
        var total = 0;

        angular.forEach(store, function( value ) {
            total += value.price * value.quantity;
        });

        return total.toFixed(2);
    };

    return cart;
}]);

myApp.controller('ProductsListCtrl', ['$scope', '$http', 'cartModel', '$cookies', function($scope, $http, cartModel, $cookies) {

    $scope.filters = {};
    $scope.orderProp = '';

    $scope.activePruductId = false;
    $scope.newQuantity = 1;

    $http.get('data/products.json').success(function ( data ) {
        $scope.products = data.products;
    });

    $http.get('data/galleries.json').success(function ( data ) {
        $scope.images = data.galleries;

        $scope.getImages = function (id) {
            var images;
            angular.forEach($scope.images, function( value, key ){
                if (id === $scope.images[key].id) {
                    images = $scope.images[key].images;
                }
            });
            return images;
        };

        $scope.getMainImage = function ( product ) {
            if ( angular.isUndefined( product.mainImageIndex ) ) {
                product.mainImageIndex = 0;
            }

            return 'images/' + product.gallery_id + '/' + $scope.getImages( product.gallery_id )[ product.mainImageIndex ];
        };

        $scope.setMainImage = function( product, index ) {
            product.mainImageIndex = index;
        };
    });

    $http.get('data/categories.json').success(function (data) {
        $scope.categories = data.categories;
    });

    $scope.toggle = function( productId ) {
        if( $scope.activePruductId === productId ) {
            return $scope.activePruductId = false;
        }
        $scope.activePruductId = productId;
    };

    $scope.isOpen = function( productId ) {
        if( $scope.activePruductId && productId ) {
            return productId === $scope.activePruductId;
        }
        return false;
    };

    $scope.addToCart = function( item, newQuantity ) {
        if (!angular.isNumber(newQuantity)) {
            newQuantity = 1;
            return 1;
        }
        cartModel.cartAdd( item, newQuantity );
        $scope.updatePruducts( item.id, newQuantity );
};

    $scope.showCart = function() {
        return cartModel.showStore();
    };

    $scope.updateCart = function( item, quantity, newQuantity ) {
        cartModel.updateQty( item.id, quantity );
        $scope.updatePruducts( item.id, newQuantity );
        angular.forEach( $scope.products, function ( product ) {
            if ( item.id !== product.id ) return;
            product.quantity = (item.oldQuantity - quantity);
        });
    };

    $scope.cartTotal = function() {
        return cartModel.total();
    };

    $scope.updatePruducts = function( itemID, newQuantity ) {
        var cartObj = cartModel.showStore();
        var cartId;

        angular.forEach(cartObj, function( value ){
            cartId = value.id;

            if (cartId !== itemID) return false;

            angular.forEach($scope.products, function( product ){
                if( cartId === product.id ) {
                    if ( product.quantity <= 0 ) {
                        return false;
                    }
                    if( newQuantity !== undefined ) {
                        return product.quantity -= newQuantity;
                    }
                    else {
                        return product.quantity = value.oldQuantity - value.quantity;
                    }
                }
            });
        });

    };

    $scope.sizeOf = function(obj) {
        return Object.keys(obj).length;
    };

}]);
