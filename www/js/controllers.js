var website = 'http://localhost/PhonePos/';
// var website = 'http://123.206.23.41/PhonePos/';
var urlLogin = website + 'user.php';
var urlGetPerson = website + 'user.php';
var urlSettingPerson = website + 'user.php';
var urlGetSystem = website + 'system.php';
var urlSettingSystem = website + 'system.php';
var urlFeedback = website + 'feedback.php';
var urlTrade = website + 'trade.php';
var urlQuery = website + 'query.php';
var urlReturns = website + 'returns.php';
var username, usercode;

angular.module('phonepos.controllers', [])

/**
 * login.html
 */
  .controller('loginCtrl', function ($scope, $http, $state, $ionicPopup) {
    $scope.loginData = {};

    // 登录操作
    $scope.login = function () {
      if ($scope.loginData.username == '' || $scope.loginData.username == null ||
        $scope.loginData.username == undefined || $scope.loginData.password == '' ||
        $scope.loginData.password == null || $scope.loginData.password == undefined) {
        $ionicPopup.alert({
          title: '提示',
          template: '用户名和密码不能为空',
          okText: '确定'
        });
        return false;
      }

      console.log('login start:', $scope.loginData);
      $http.post(urlLogin, {
        data: $scope.loginData,
        method: 'login'
      }).success(function (response) {
        console.log('login success:', response);
        if (response.msgcode == 1) {
          username = $scope.loginData.username;
          usercode = response.msgmain.usercode;
          $state.go('menu.trade');
          // location.href = '#/menu/trade';
        } else {
          $ionicPopup.alert({
            title: '提示',
            template: '用户名或密码错误',
            okText: '确定'
          });
        }
      }).error(function () {
        console.log('login fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });

        //TODO 测试
        //$state.go('menu.search');
      })
    };
  })

  /**
   * menu.html
   */
  .controller('menuCtrl', function ($scope) {
  })

  /**
   * trade.html
   */
  .controller('tradeCtrl', function ($scope, $http, $ionicModal, $ionicPopup) {
    $scope.tradeData = {};

    $ionicModal.fromTemplateUrl('templates/trade-pay.html', {
      scope: $scope,
      animation: "slide-in-up"
    }).then(function (modal) {
      $scope.modal = modal;
    });

    // TODO 测试
    username = 'test';
    usercode = '1234';

    // 商品编码
    var plucode;
    // 已添加的商品
    var commodity = '';
    // 会员卡面号
    var cardfaceno = '';
    // 是否验证会员，0：非会员；1：会员
    var isvip = 0;
    // 订单合计（应付）
    var total = 0;
    // 已付，未付，找零
    var hasPay = 0, noPay = 0, change = 0;
    // 已使用的支付方式
    var pay = '';


    $scope.tradeData.customer = '普通';
    total = total.toFixed(2);
    $scope.tradeData.total = total;

    // 点击确认按钮
    $scope.tradeConfirm = function () {
      // 设置行清删除按钮不可见
      $scope.tradeData.clearLine = false;

      if ($scope.tradeData.plucode == '' || $scope.tradeData.plucode == null ||
        $scope.tradeData.plucode == undefined) {
        $ionicPopup.alert({
          title: '提示',
          template: '商品编码不能为空',
          okText: '确定'
        });
        return false;
      }

      plucode = $scope.tradeData.plucode;
      console.log('select commodity start:', $scope.tradeData.plucode);
      $http.post(urlTrade, {
        data: plucode,
        username: username,
        method: 'selectCommodity'
      }).success(function (response) {
        console.log('select commodity success:', response);
        afterSelectCommodity(response);
      }).error(function () {
        console.log('select commodity fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      });
    };

    // 点击行清按钮
    $scope.tradeClearLine = function () {
      $scope.tradeData.clearLine = !$scope.tradeData.clearLine;
    };

    // 删除某一商品（行清）
    $scope.tradeClearLineItem = function (commod) {
      $ionicPopup.confirm({
        title: '提示',
        template: '该操作不可撤销，是否删除当前商品',
        okText: '确定',
        cancelText: '取消'
      }).then(function (result) {
        if (result) {
          clearLineCommodity(commod);
        }
      });
    };

    // 点击总清按钮
    $scope.tradeClearAll = function () {
      if (commodity == '') {
        return false;
      }

      $ionicPopup.confirm({
        title: '提示',
        template: '该操作不可撤销，是否清空当前订单',
        okText: '确定',
        cancelText: '取消'
      }).then(function (result) {
        if (result) {
          $scope.tradeData.commodity = '';
          commodity = '';
          total = 0;
          total = total.toFixed(2);
          $scope.tradeData.total = total;
          console.log('tradeClearAll begin:',
            '$scope.tradeData.commodity:' + $scope.tradeData.commodity +
            ';commodity:' + commodity);
        }
      });
    };

    // 点击会员按钮
    $scope.tradeVip = function () {
      // 设置行清删除按钮不可见
      $scope.tradeData.clearLine = false;

      $scope.popupTradeData = {};

      if (commodity != '') {
        $ionicPopup.alert({
          title: '提示',
          template: '当前订单非空，请总清后再录入会员',
          okText: '确定'
        });
      } else {
        $ionicPopup.show({
          title: '会员',
          template: '<input type="number" placeholder="请输入会员卡号" ng-model="popupTradeData.number">',
          scope: $scope,
          buttons: [
            {
              text: "取消",
              onTap: function () {
                return false;
              }
            },
            {
              text: "确定",
              type: "button-positive",
              onTap: function () {
                return true;
              }
            }
          ]
        }).then(function (result) {
          if (result) {
            verifyVip($scope.popupTradeData.number);
          }
        });
      }
    };

    // 点击合计按钮
    $scope.tradeTotal = function () {
      if (total == 0) {
        $ionicPopup.alert({
          title: '提示',
          template: '请先录入商品，再合计',
          okText: '确定'
        });
        return false;
      }

      if ($scope.tradeData.order == '' || $scope.tradeData.order == null ||
        $scope.tradeData.order == undefined) {
        //生成流水号，流水号 = 当前时间(yyyyMMddHHmm) + 用户编码 + 四位随机数
        var randNum = Math.round(Math.random() * 1000);
        randNum = formatNumber(randNum, 4, '0', 'l');
        $scope.tradeData.order = formatDate(new Date()) + usercode + randNum;
      }

      hasPay = parseFloat(hasPay).toFixed(2);
      noPay = (parseFloat(total) - parseFloat(hasPay)).toFixed(2);
      if (parseFloat(noPay) < 0) {
        noPay = 0;
        noPay = noPay.toFixed(2);
      }
      change = parseFloat(change).toFixed(2);
      $scope.tradeData.hasPay = hasPay;
      $scope.tradeData.noPay = noPay;
      $scope.tradeData.change = change;

      // 设置删除支付按钮默认不可见
      $scope.tradeData.deletePay = false;
      loadPayMode();
    };

    // 点击 trade-pay.html 关闭按钮
    $scope.closeTradePay = function () {
      // 设置删除支付按钮不可见
      $scope.tradeData.deletePay = false;

      $ionicPopup.confirm({
        title: '提示',
        template: '该操作不删除订单信息，确认关闭支付页面',
        okText: '确定',
        cancelText: '取消'
      }).then(function (result) {
        if (result) {
          $scope.modal.hide();
        }
      });
    };

    // 点击 trade-pay.html 某一支付方式按钮
    $scope.tradePayMode = function (pm) {
      // 设置删除支付按钮不可见
      $scope.tradeData.deletePay = false;

      $scope.popupTradeData = {};

      if ($scope.tradeData.noPay == 0) {
        $ionicPopup.alert({
          title: '提示',
          template: '当前订单已支付完成，无需再进行支付',
          okText: '确定'
        });
        return false;
      }
      $ionicPopup.show({
        title: pm['payname'],
        template: '<input type="number" placeholder="请输入支付金额" ng-model="popupTradeData.total">',
        scope: $scope,
        buttons: [
          {
            text: "取消",
            onTap: function () {
              return false;
            }
          },
          {
            text: "确定",
            type: "button-positive",
            onTap: function () {
              return true;
            }
          }
        ]
      }).then(function (result) {
        if (result) {
          payOrder(pm, $scope.popupTradeData.total);
        }
      });
    };

    // 点击删除支付按钮
    $scope.tradeDeletePay = function () {
      $scope.tradeData.deletePay = !$scope.tradeData.deletePay;
    };

    // 删除某一支付方式
    $scope.tradeDeletePayItem = function (p) {
      $ionicPopup.confirm({
        title: '提示',
        template: '该操作不可撤销，是否删除当前支付方式',
        okText: '确定',
        cancelText: '取消'
      }).then(function (result) {
        if (result) {
          deleteLinePay(p);
        }
      });
    };

    // 点击清空订单按钮
    $scope.tradeClearPay = function () {
      $ionicPopup.confirm({
        title: '提示',
        template: '该操作不可撤销，是否清空当前订单',
        okText: '确定',
        cancelText: '取消'
      }).then(function (result) {
        if (result) {
          initializeInfo();
          $scope.modal.hide();
        }
      });
    };

    // 点击完成支付按钮
    $scope.tradeEndPay = function () {
      // 设置删除支付按钮不可见
      $scope.tradeData.deletePay = false;

      if ($scope.tradeData.noPay != 0) {
        $ionicPopup.alert({
          title: '提示',
          template: '当前订单未支付完成，不能完成支付',
          okText: '确定'
        });
        return false;
      }

      $ionicPopup.confirm({
        title: '提示',
        template: '是否完成支付',
        okText: '确定',
        cancelText: '取消'
      }).then(function (result) {
        if (result) {
          orderEndPay();
        }
      });
    };

    /**
     * 查询商品成功后相关操作
     *
     * @param response 查询商品成功后返回信息
     */
    function afterSelectCommodity(response) {
      if (response.msgcode == 1) {
        if (response.msgmain.issale == '0') {
          $ionicPopup.alert({
            title: '提示',
            template: '该商品已下架',
            okText: '确定'
          });
        } else if (response.msgmain.isinventory == '0') {
          $ionicPopup.alert({
            title: '提示',
            template: '该商品库存为零',
            okText: '确定'
          });
        } else if (response.msgmain.ispresent == '1') {
          $ionicPopup.confirm({
            title: '提示',
            template: '该商品为赠品，是否销售',
            okText: '确定',
            cancelText: '取消'
          }).then(function (result) {
            if (result) {
              makeTradeCommodity(response);
            }
          });
        } else {
          makeTradeCommodity(response);
        }
      } else {
        $ionicPopup.alert({
          title: '提示',
          template: '不存在该商品',
          okText: '确定'
        });
      }
      $scope.tradeData.plucode = '';
    }

    /**
     * 组装商品信息
     *
     * @param response 查询商品成功后返回信息
     */
    function makeTradeCommodity(response) {
      var pluname, price, number, no;
      pluname = response.msgmain.pluname;
      if (isvip == 0) {
        price = response.msgmain.price;
      } else {
        price = response.msgmain.vipprice;
      }

      var commodityInfo =
        '<div class="commodity-info">商品编码：' + plucode + '</div>' +
        '<div class="commodity-info">商品名称：' + pluname + '</div>' +
        '<div class="commodity-info">发生价格：' + price + '元</div>' +
        '<div class="commodity-info commodity-number">销售数量：</div>';

      $scope.popupTradeData = {};
      $ionicPopup.show({
        title: '确认订单',
        template: commodityInfo + '<input type="number" class="commodity-input" placeholder="1" ng-model="popupTradeData.number">',
        scope: $scope,
        buttons: [
          {
            text: "取消",
            onTap: function () {
              return false;
            }
          },
          {
            text: "确定",
            type: "button-positive",
            onTap: function () {
              return true;
            }
          }
        ]
      }).then(function (result) {
        if (result) {
          if ($scope.popupTradeData.number <= 0) {
            return false;
          } else if ($scope.popupTradeData.number == '' ||
            $scope.popupTradeData.number == null ||
            $scope.popupTradeData.number == undefined) {
            number = 1;
          } else {
            number = $scope.popupTradeData.number;
          }

          if (commodity == '') {
            commodity = '{' +
              '"no": "1",' +
              '"code": "' + plucode + '",' +
              '"name": "' + pluname + '",' +
              '"price": "' + price + '",' +
              '"number": "' + number + '",' +
              '"total": "' + (price * number).toFixed(2) + '"' +
              '}';
          } else {
            no = $scope.tradeData.commodity.length + 1;
            commodity += ',{' +
              '"no": "' + no + '",' +
              '"code": "' + plucode + '",' +
              '"name": "' + pluname + '",' +
              '"price": "' + price + '",' +
              '"number": "' + number + '",' +
              '"total": "' + (price * number).toFixed(2) + '"' +
              '}';
          }
          console.log('makeTradeCommodity success commodity:', commodity);

          total = parseFloat(total) + price * number;
          total = total.toFixed(2);
          var commodityJSON = '[' + commodity + ']';
          $scope.tradeData.commodity = JSON.parse(commodityJSON);
          $scope.tradeData.total = total;
          console.log('makeTradeCommodity success tradeData.commodity:', $scope.tradeData.commodity);
        }
        $scope.popupTradeData.number = '';
      });
    }

    /**
     * 删除某一商品
     *
     * @param commod 要删除的商品
     */
    function clearLineCommodity(commod) {
      console.log('clearLineCommodity begin:', commod);
      var index = $scope.tradeData.commodity.indexOf(commod);
      var price = $scope.tradeData.commodity[index]['total'];
      $scope.tradeData.commodity.splice(index, 1);
      console.log('clearLineCommodity success:', $scope.tradeData.commodity);

      // 商品序号重新设置，删除某一商品后，后面商品序号依次减1
      for (var i = index; i < $scope.tradeData.commodity.length; i++) {
        $scope.tradeData.commodity[i]['no'] = parseInt($scope.tradeData.commodity[i]['no']) - 1;
        console.log('clearLineCommodity reset no success:', $scope.tradeData.commodity);
      }

      // 将 commodity 字符串中相应商品删除
      commodity = JSON.stringify($scope.tradeData.commodity);
      console.log('clearLineCommodity reset commodity begin:', commodity);
      commodity = commodity.substring(commodity.indexOf('[') + 1, commodity.indexOf(']'));
      console.log('clearLineCommodity reset commodity success:', commodity);

      // 将合计中总金额减去相应商品价格
      total = parseFloat(total) - price;
      total = total.toFixed(2);
      $scope.tradeData.total = total;
    }

    /**
     * 会员验证
     *
     * @param cardfno 卡面号
     */
    function verifyVip(cardfno) {
      if (cardfno == '' || cardfno == null || cardfno == undefined) {
        $ionicPopup.alert({
          title: '提示',
          template: '卡号不能为空',
          okText: '确定'
        });
      } else {
        console.log('verifyVip start:', cardfno);
        $http.post(urlTrade, {
          data: cardfno,
          username: username,
          method: 'vipVerify'
        }).success(function (response) {
          console.log('verifyVip success:', response);
          if (response.msgcode == 1) {
            $scope.tradeData.customer = '会员（' + response.msgmain.name + '）';
            isvip = 1;
            cardfaceno = cardfno;
          } else {
            $ionicPopup.alert({
              title: '提示',
              template: '卡号错误',
              okText: '确定'
            });
          }
        }).error(function () {
          console.log('verifyVip fail:', '网络异常');
          $ionicPopup.alert({
            title: '提示',
            template: '网络异常',
            okText: '确定'
          });
        })
      }
    }

    /**
     * 加载支付方式
     */
    function loadPayMode() {
      console.log('loadPayMode start');
      $http.post(urlTrade, {
        method: 'loadPayMode'
      }).success(function (response) {
        console.log('loadPayMode success:', response);
        if (response.msgcode == 1) {
          $scope.tradeData.payMode = response.msgmain;
          $scope.modal.show();
        }
      }).error(function () {
        console.log('loadPayMode fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      });
    }

    /**
     * 支付订单
     *
     * @param pm 支付方式payMode
     * @param total 支付金额
     */
    function payOrder(pm, total) {
      if (total <= 0) {
        $ionicPopup.alert({
          title: '提示',
          template: '支付金额错误',
          okText: '确定'
        });
        return false;
      } else if (total == '' || total == null || total == undefined) {
        $ionicPopup.alert({
          title: '提示',
          template: '支付金额不能为空',
          okText: '确定'
        });
        return false;
      }

      total = total.toFixed(2);
      if (pay == '') {
        pay = '{' +
          '"no": "1",' +
          '"code": "' + pm["paycode"] + '",' +
          '"name": "' + pm["payname"] + '",' +
          '"total": "' + total + '"' +
          '}';
      } else {
        var no = $scope.tradeData.pay.length + 1;
        pay += ',{' +
          '"no": "' + no + '",' +
          '"code": "' + pm["paycode"] + '",' +
          '"name": "' + pm["payname"] + '",' +
          '"total": "' + total + '"' +
          '}';
      }
      console.log('payOrder success pay:', pay);

      var payJSON = '[' + pay + ']';
      $scope.tradeData.pay = JSON.parse(payJSON);
      console.log('payOrder success tradeData.pay:', $scope.tradeData.pay);

      hasPay = parseFloat(hasPay) + parseFloat(total);
      hasPay = parseFloat(hasPay).toFixed(2);
      noPay = parseFloat(noPay) - parseFloat(total);
      if (noPay >= 0) {
        noPay = noPay.toFixed(2);
      } else {
        change = -noPay;
        change = change.toFixed(2);
        noPay = 0;
        noPay = noPay.toFixed(2);
      }
      $scope.tradeData.hasPay = hasPay;
      $scope.tradeData.noPay = noPay;
      $scope.tradeData.change = change;
    }

    /**
     * 删除某一支付方式
     *
     * @param p 要删除的支付方式
     */
    function deleteLinePay(p) {
      console.log('deleteLinePay begin:', p);
      var index = $scope.tradeData.pay.indexOf(p);
      var total = $scope.tradeData.pay[index]['total'];
      $scope.tradeData.pay.splice(index, 1);
      console.log('deleteLinePay success:', $scope.tradeData.pay);

      // 支付方式序号重新设置，删除某一支付方式后，后面支付方式序号依次减1
      for (var i = index; i < $scope.tradeData.pay.length; i++) {
        $scope.tradeData.pay[i]['no'] = parseInt($scope.tradeData.pay[i]['no']) - 1;
        console.log('deleteLinePay reset no success:', $scope.tradeData.pay);
      }

      // 将 pay 字符串中相应支付方式删除
      pay = JSON.stringify($scope.tradeData.pay);
      console.log('deleteLinePay reset pay begin:', pay);
      pay = pay.substring(pay.indexOf('[') + 1, pay.indexOf(']'));
      console.log('deleteLinePay reset pay success:', pay);

      // 将已付、未付、找零金额做相关处理，相应支付方式已支付金额
      hasPay = parseFloat(hasPay) - parseFloat(total);
      hasPay = parseFloat(hasPay).toFixed(2);
      if (parseFloat(change) == 0) {
        noPay = parseFloat(noPay) + parseFloat(total);
        noPay = noPay.toFixed(2);
      } else {
        change = parseFloat(change) - total;
        if (change < 0) {
          noPay = -change;
          noPay = noPay.toFixed(2);
          change = 0;
          change = change.toFixed(2);
        } else {
          change = change.toFixed(2);
        }
      }
      $scope.tradeData.hasPay = hasPay;
      $scope.tradeData.noPay = noPay;
      $scope.tradeData.change = change;
    }

    /**
     * 完成支付
     */
    function orderEndPay() {
      saveOrder();
    }

    /**
     * 保存流水信息
     */
    function saveOrder() {
      console.log('saveOrder start:', $scope.tradeData.commodity);
      $http.post(urlTrade, {
        data: $scope.tradeData.commodity,
        username: username,
        order: $scope.tradeData.order,
        total: $scope.tradeData.total,
        cardfaceno: cardfaceno,
        method: 'saveOrder'
      }).success(function (response) {
        console.log('saveOrder success:', response);
        if (response.msgcode == 1) {
          savePay();
        }
      }).error(function () {
        console.log('saveOrder fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      });
    }

    /**
     * 保存支付信息
     */
    function savePay() {
      console.log('savePay start:', $scope.tradeData.pay);
      $http.post(urlTrade, {
        data: $scope.tradeData.pay,
        username: username,
        order: $scope.tradeData.order,
        haspay: $scope.tradeData.hasPay,
        change: $scope.tradeData.change,
        method: 'savePay'
      }).success(function (response) {
        console.log('savePay success:', response);
        if (response.msgcode == 1) {
          initializeInfo();
          $scope.modal.hide();
        }
      }).error(function () {
        console.log('savePay fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      });
    }

    /**
     * 初始化相关数据
     */
    function initializeInfo() {
      $scope.tradeData.clearLine = false;
      $scope.tradeData.deletePay = false;

      plucode = '';
      $scope.tradeData.plucode = '';

      commodity = '';
      $scope.tradeData.commodity = '';
      pay = '';
      $scope.tradeData.pay = '';

      $scope.tradeData.order = '';

      cardfaceno = '';
      isvip = 0;
      $scope.tradeData.customer = '普通';

      total = 0;
      hasPay = 0;
      noPay = 0;
      change = 0;
      total = total.toFixed(2);
      hasPay = hasPay.toFixed(2);
      noPay = noPay.toFixed(2);
      change = change.toFixed(2);
      $scope.tradeData.total = total;
      $scope.tradeData.hasPay = hasPay;
      $scope.tradeData.noPay = noPay;
      $scope.tradeData.change = change;
    }
  })

  /**
   * query.html
   */
  .controller('queryCtrl', function ($scope, $http, $ionicPopup) {
    $scope.queryData = {};

    $scope.queryBlank = true;
    $scope.queryCommodityButton = false;
    $scope.queryInput = false;
    $scope.querySale = false;
    $scope.queryCommoditys = false;

    // 调用的方法
    var method = '';

    // 点击订单查询按钮
    $scope.queryOrder = function () {
      method = 'queryOrder';

      $scope.queryInput = true;

      $scope.queryCommodityButton = false;
      $scope.queryCommoditys = false;
    };

    // 点击商品查询按钮
    $scope.queryCommodity = function () {
      $scope.queryCommodityButton = true;

      $scope.queryInput = false;
      $scope.querySale = false;
    };

    // 点击所有按钮
    $scope.queryCommodityAll = function () {
      method = 'queryCommodityAll';

      $scope.queryInput = true;
    };

    // 点击按编码按钮
    $scope.queryCommodityCode = function () {
      method = 'queryCommodityCode';

      $scope.queryInput = true;
    };

    // 点击按名称按钮
    $scope.queryCommodityName = function () {
      method = 'queryCommodityName';

      $scope.queryInput = true;
    };

    // 点击确认按钮
    $scope.queryConfirm = function () {
      if ($scope.queryData.input == '' || $scope.queryData.input == null ||
        $scope.queryData.input == undefined) {
        $ionicPopup.alert({
          title: '提示',
          template: '查询关键字不能为空',
          okText: '确定'
        });
        return false;
      }

      var input = $scope.queryData.input;

      console.log(method + ' start:', $scope.queryData.input);
      $http.post(urlQuery, {
        data: input.toString(),
        username: username,
        method: method
      }).success(function (response) {
        console.log(method + ' success:', response);
        afterQuery(response);
      }).error(function () {
        console.log(method + ' fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      });
    };

    /**
     * 查询成功后相关操作
     *
     * @param response 查询成功后返回信息
     */
    function afterQuery(response) {
      var commodityinfo, total, cardfaceno;

      if (response.msgcode == 1) {
        if (response.msgmain.username != '') {
          $ionicPopup.alert({
            title: '提示',
            template: '该订单已经退款，不再提供查询',
            okText: '确定'
          });
          return false;
        }

        commodityinfo = response.msgmain.commodityinfo.data;
        total = response.msgmain.commodityinfo.total;
        cardfaceno = response.msgmain.commodityinfo.cardfaceno;
        console.log('afterQuery read info success commodityinfo:', commodityinfo);
        console.log('afterQuery read info success total:', total);
        console.log('afterQuery read info success cardfaceno:', cardfaceno);

        $scope.returnsData.order = order;
        if (cardfaceno == '') {
          $scope.returnsData.customer = '普通';
        } else {
          $scope.returnsData.customer = '会员';
        }
        $scope.returnsData.commodity = commodityinfo;
        $scope.returnsData.total = total;

        $scope.returnsBlank = false;
        $scope.returnsOrder = true;
      } else {
        $ionicPopup.alert({
          title: '提示',
          template: '该订单不存在',
          okText: '确定'
        });
      }


      if (method == 'queryOrder') {
        $scope.queryBlank = false;
        $scope.querySale = true;
      } else {
        $scope.queryBlank = false;
        $scope.queryCommoditys = true;
      }
    }
  })

  /**
   * returns.html
   */
  .controller('returnsCtrl', function ($scope, $http, $ionicModal, $ionicPopup) {
    $scope.returnsData = {};

    $ionicModal.fromTemplateUrl('templates/returns-pay.html', {
      scope: $scope,
      animation: "slide-in-up"
    }).then(function (modal) {
      $scope.modal = modal;
    });

    $scope.returnsBlank = true;
    $scope.returnsOrder = false;

    // TODO 测试
    username = 'test';
    usercode = '1234';

    // 订单流水号
    var order;
    // 订单合计
    var total = 0;
    // 已退，未退
    var hasPay = 0, noPay = 0;
    // 已使用的退款方式
    var pay = '';
    // 会员卡面号
    var cardfaceno = '';

    // 点击退货按钮
    $scope.returnsReturns = function () {
      if ($scope.returnsData.ordernum == '' || $scope.returnsData.ordernum == null ||
        $scope.returnsData.ordernum == undefined) {
        $ionicPopup.alert({
          title: '提示',
          template: '订单流水号不能为空',
          okText: '确定'
        });
        return false;
      }

      order = $scope.returnsData.ordernum;

      var date = new Date();
      date.setDate(date.getDate() - 7);
      date = formatDate(date);
      if (order.substring(0, 8) < date.substring(0, 8)) {
        $ionicPopup.alert({
          title: '提示',
          template: '超出退货期限',
          okText: '确定'
        });
        return false;
      }

      console.log('select order start:', $scope.returnsData.ordernum);
      $http.post(urlReturns, {
        data: order.toString(),
        username: username,
        method: 'selectOrder'
      }).success(function (response) {
        console.log('select order success:', response);
        afterSelectOrder(response);
      }).error(function () {
        console.log('select order fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      });
    };

    // 点击确认按钮
    $scope.returnsConfirm = function () {
      hasPay = parseFloat(hasPay).toFixed(2);
      noPay = (parseFloat(total) - parseFloat(hasPay)).toFixed(2);
      if (parseFloat(noPay) < 0) {
        noPay = 0;
        noPay = noPay.toFixed(2);
      }
      $scope.returnsData.hasPay = hasPay;
      $scope.returnsData.noPay = noPay;

      $scope.returnsData.deletePay = false;
      loadPayMode();
    };

    // 点击 returns-pay.html 关闭按钮
    $scope.closeReturnsPay = function () {
      // 设置删除退款按钮不可见
      $scope.returnsData.deletePay = false;

      $ionicPopup.confirm({
        title: '提示',
        template: '该操作将清空退款信息，确认关闭退款页面',
        okText: '确定',
        cancelText: '取消'
      }).then(function (result) {
        if (result) {
          initializeInfo();
          $scope.modal.hide();
        }
      });
    };

    // 点击 returns-pay.html 某一支付方式按钮
    $scope.returnsPayMode = function (pm) {
      // 设置删除退款按钮不可见
      $scope.returnsData.deletePay = false;

      $scope.popupTradeData = {};

      if ($scope.returnsData.noPay == 0) {
        $ionicPopup.alert({
          title: '提示',
          template: '当前订单已退款完成，无需再进行退款',
          okText: '确定'
        });
        return false;
      }
      $ionicPopup.show({
        title: pm['payname'],
        template: '<input type="number" placeholder="请输入退款金额" ng-model="popupTradeData.total">',
        scope: $scope,
        buttons: [
          {
            text: "取消",
            onTap: function () {
              return false;
            }
          },
          {
            text: "确定",
            type: "button-positive",
            onTap: function () {
              return true;
            }
          }
        ]
      }).then(function (result) {
        if (result) {
          returnsOrder(pm, $scope.popupTradeData.total);
        }
      });
    };

    // 点击删除退款按钮
    $scope.returnsDeletePay = function () {
      $scope.returnsData.deletePay = !$scope.returnsData.deletePay;
    };

    // 删除某一退款方式
    $scope.returnsDeletePayItem = function (p) {
      $ionicPopup.confirm({
        title: '提示',
        template: '该操作不可撤销，是否删除当前退款',
        okText: '确定',
        cancelText: '取消'
      }).then(function (result) {
        if (result) {
          deleteLinePay(p);
        }
      });
    };

    // 点击清空退款按钮
    $scope.returnsClearPay = function () {
      $ionicPopup.confirm({
        title: '提示',
        template: '该操作不可撤销，是否清空当前退款',
        okText: '确定',
        cancelText: '取消'
      }).then(function (result) {
        if (result) {
          pay = '';
          $scope.returnsData.pay = pay;

          hasPay = 0;
          hasPay = hasPay.toFixed(2);
          noPay = parseFloat(total);
          noPay = noPay.toFixed(2);
          $scope.returnsData.hasPay = hasPay;
          $scope.returnsData.noPay = noPay;
        }
      });
    };

    // 点击完成退款按钮
    $scope.returnsEndPay = function () {
      // 设置删除退款不可见
      $scope.returnsData.deletePay = false;

      if ($scope.returnsData.noPay != 0) {
        $ionicPopup.alert({
          title: '提示',
          template: '当前订单未退款完成，不能完成退款',
          okText: '确定'
        });
        return false;
      }

      $ionicPopup.confirm({
        title: '提示',
        template: '是否完成退款',
        okText: '确定',
        cancelText: '取消'
      }).then(function (result) {
        if (result) {
          returnsEndPay();
        }
      });
    };

    /**
     * 查询订单成功后相关操作
     *
     * @param response 查询订单成功后返回信息
     */
    function afterSelectOrder(response) {
      var commodityinfo, payinfo;

      if (response.msgcode == 1) {
        if (!(response.msgmain.username == '' || response.msgmain.username == null ||
          response.msgmain.username == undefined)) {
          $ionicPopup.alert({
            title: '提示',
            template: '该订单已经退款',
            okText: '确定'
          });
          return false;
        }

        commodityinfo = response.msgmain.commodityinfo.data;
        payinfo = response.msgmain.payinfo.data;
        total = response.msgmain.commodityinfo.total;
        cardfaceno = response.msgmain.commodityinfo.cardfaceno;
        console.log('afterSelectOrder read info success commodityinfo:', commodityinfo);
        console.log('afterSelectOrder read info success payinfo:', payinfo);
        console.log('afterSelectOrder read info success total:', total);
        console.log('afterSelectOrder read info success cardfaceno:', cardfaceno);

        $scope.returnsData.order = order;
        if (cardfaceno == '') {
          $scope.returnsData.customer = '普通';
        } else {
          $scope.returnsData.customer = '会员';
        }
        $scope.returnsData.commodity = commodityinfo;
        $scope.returnsData.total = total;

        $scope.returnsBlank = false;
        $scope.returnsOrder = true;
      } else {
        $ionicPopup.alert({
          title: '提示',
          template: '该订单不存在',
          okText: '确定'
        });
      }
    }

    /**
     * 加载退款支付方式
     */
    function loadPayMode() {
      console.log('loadPayMode start');
      $http.post(urlTrade, {
        method: 'loadPayMode'
      }).success(function (response) {
        console.log('loadPayMode success:', response);
        if (response.msgcode == 1) {
          $scope.returnsData.payMode = response.msgmain;
          $scope.modal.show();
        }
      }).error(function () {
        console.log('loadPayMode fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      });
    }

    /**
     * 退款
     *
     * @param pm 支付方式payMode
     * @param total 退款金额
     */
    function returnsOrder(pm, total) {
      if (total <= 0) {
        $ionicPopup.alert({
          title: '提示',
          template: '退款金额错误',
          okText: '确定'
        });
        return false;
      } else if (total == '' || total == null || total == undefined) {
        $ionicPopup.alert({
          title: '提示',
          template: '退款金额不能为空',
          okText: '确定'
        });
        return false;
      } else if (total > parseFloat(noPay)) {
        $ionicPopup.alert({
          title: '提示',
          template: '退款金额超出最大可退款金额',
          okText: '确定'
        });
        return false;
      }

      total = total.toFixed(2);
      if (pay == '') {
        pay = '{' +
          '"no": "1",' +
          '"code": "' + pm["paycode"] + '",' +
          '"name": "' + pm["payname"] + '",' +
          '"total": "' + total + '"' +
          '}';
      } else {
        var no = $scope.returnsData.pay.length + 1;
        pay += ',{' +
          '"no": "' + no + '",' +
          '"code": "' + pm["paycode"] + '",' +
          '"name": "' + pm["payname"] + '",' +
          '"total": "' + total + '"' +
          '}';
      }
      console.log('returnsOrder success pay:', pay);

      var payJSON = '[' + pay + ']';
      $scope.returnsData.pay = JSON.parse(payJSON);
      console.log('returnsOrder success tradeData.pay:', $scope.returnsData.pay);

      hasPay = parseFloat(hasPay) + parseFloat(total);
      hasPay = parseFloat(hasPay).toFixed(2);
      noPay = parseFloat(noPay) - parseFloat(total);
      noPay = parseFloat(noPay).toFixed(2);
      $scope.returnsData.hasPay = hasPay;
      $scope.returnsData.noPay = noPay;
    }

    /**
     * 删除某一退款
     *
     * @param p 要删除的支付方式
     */
    function deleteLinePay(p) {
      console.log('deleteLinePay returns begin:', p);
      var index = $scope.returnsData.pay.indexOf(p);
      var total = $scope.returnsData.pay[index]['total'];
      $scope.returnsData.pay.splice(index, 1);
      console.log('deleteLinePay returns success:', $scope.returnsData.pay);

      // 退款序号重新设置，删除某一退款后，后面退款序号依次减1
      for (var i = index; i < $scope.returnsData.pay.length; i++) {
        $scope.returnsData.pay[i]['no'] = parseInt($scope.returnsData.pay[i]['no']) - 1;
        console.log('deleteLinePay returns reset no success:', $scope.returnsData.pay);
      }

      // 将 pay 字符串中相应支付方式删除
      pay = JSON.stringify($scope.returnsData.pay);
      console.log('deleteLinePay returns reset pay begin:', pay);
      pay = pay.substring(pay.indexOf('[') + 1, pay.indexOf(']'));
      console.log('deleteLinePay returns reset pay success:', pay);

      // 将已退、未退金额做相关处理
      hasPay = parseFloat(hasPay) - parseFloat(total);
      hasPay = parseFloat(hasPay).toFixed(2);
      noPay = parseFloat(noPay) + parseFloat(total);
      noPay = noPay.toFixed(2);
      $scope.returnsData.hasPay = hasPay;
      $scope.returnsData.noPay = noPay;
    }

    /**
     * 完成退款
     */
    function returnsEndPay() {
      saveReturns();
    }

    /**
     * 保存退款信息
     */
    function saveReturns() {
      console.log('saveReturns start:', $scope.returnsData.commodity);
      $http.post(urlReturns, {
        data: $scope.returnsData.commodity,
        username: username,
        order: $scope.returnsData.order,
        total: $scope.returnsData.total,
        cardfaceno: cardfaceno,
        method: 'saveReturns'
      }).success(function (response) {
        console.log('saveReturns success:', response);
        if (response.msgcode == 1) {
          saveReturnsPay();
        }
      }).error(function () {
        console.log('saveReturns fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      });
    }

    /**
     * 保存退款支付信息
     */
    function saveReturnsPay() {
      console.log('saveReturnsPay start:', $scope.returnsData.pay);
      $http.post(urlReturns, {
        data: $scope.returnsData.pay,
        username: username,
        order: $scope.returnsData.order,
        haspay: $scope.returnsData.hasPay,
        method: 'saveReturnsPay'
      }).success(function (response) {
        console.log('saveReturnsPay success:', response);
        if (response.msgcode == 1) {
          initializeInfo();
          $scope.modal.hide();
        }
      }).error(function () {
        console.log('saveReturnsPay fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      });
    }

    /**
     * 初始化相关数据
     */
    function initializeInfo() {
      $scope.returnsBlank = true;
      $scope.returnsOrder = false;

      $scope.returnsData.deletePay = false;

      order = '';
      $scope.returnsData.ordernum = order;
      $scope.returnsData.order = order;

      cardfaceno = '';
      $scope.returnsData.customer = '';

      $scope.returnsData.commodity = '';
      pay = '';
      $scope.returnsData.pay = pay;

      total = 0;
      hasPay = 0;
      noPay = 0;
      total = total.toFixed(2);
      hasPay = hasPay.toFixed(2);
      noPay = noPay.toFixed(2);
      $scope.returnsData.total = total;
      $scope.returnsData.hasPay = hasPay;
      $scope.returnsData.noPay = noPay;
    }
  })

  /**
   * dayover.html
   */
  .controller('dayOverCtrl', function ($scope, $http) {
    //TODO
  })

  /**
   * setting.html
   */
  .controller('settingCtrl', function ($scope, $state) {
    //点击取消按钮
    $scope.settingCancel = function () {
      //这里跳转到新界面需刷新，否则会有缓存，导致后续操作出问题
      $state.go('menu.trade');
      location.reload();
    };
  })

  /**
   * setting-person.html
   */
  .controller('settingPersonCtrl', function ($scope, $http, $ionicPopup) {
    $scope.settingPersonData = {};

    $scope.settingPersonBtnConfirm = false;
    $scope.settingPersonBtnModify = true;

    // TODO 测试
    username = 'test';

    console.log('getPerson begin:', username);
    $http.post(urlGetPerson, {
      username: username,
      method: 'getPerson'
    }).success(function (response) {
      console.log('getPerson success:', response);
      if (response.msgcode == 1) {
        $scope.settingPersonData.username = username;
        $scope.settingPersonData.usercode = response.msgmain.usercode;
        $scope.settingPersonData.name = response.msgmain.name;
        $scope.settingPersonData.phone = parseInt(response.msgmain.phone);
      } else {
        // 个人设置信息为空
      }
    }).error(function () {
      console.log('getPerson fail:', '网络异常');
      $ionicPopup.alert({
        title: '提示',
        template: '网络异常',
        okText: '确定'
      });
    });

    // 点击修改按钮
    $scope.settingPersonModify = function () {
      $scope.settingPersonBtnModify = false;
      $scope.settingPersonBtnConfirm = true;
    };

    //点击取消按钮
    $scope.settingPersonCancel = function () {
      location.reload();
    };

    // 点击确认按钮
    $scope.settingPerson = function () {
      if ($scope.settingPersonData.name == '' || $scope.settingPersonData.name == null ||
        $scope.settingPersonData.name == undefined || $scope.settingPersonData.phone == '' ||
        $scope.settingPersonData.phone == null || $scope.settingPersonData.phone == undefined) {
        $ionicPopup.alert({
          title: '提示',
          template: '个人信息不能为空',
          okText: '确定'
        });
        return false;
      }
      if ($scope.settingPersonData.phone.toString().length != 11) {
        $ionicPopup.alert({
          title: '提示',
          template: '手机号码格式错误',
          okText: '确定'
        });
        return false;
      }

      console.log('settingPerson start:', $scope.settingPersonData);
      $http.post(urlSettingPerson, {
        data: $scope.settingPersonData,
        method: 'settingPerson'
      }).success(function (response) {
        console.log('settingPerson success:', response);
        if (response.msgcode == 1) {
          $scope.settingPersonBtnConfirm = false;
          $scope.settingPersonBtnModify = true;
          $ionicPopup.alert({
            title: '提示',
            template: '修改成功',
            okText: '确定'
          });
        } else {
          $ionicPopup.alert({
            title: '提示',
            template: '修改失败，请重试',
            okText: '确定'
          });
        }
      }).error(function () {
        console.log('settingPerson fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      })
    };
  })

  /**
   * setting-system.html
   */
  .controller('settingSystemCtrl', function ($scope, $http, $ionicPopup) {
    $scope.settingSystemData = {};

    $scope.settingSystemBtnConfirm = false;
    $scope.settingSystemBtnModify = true;

    // 系统设置是否为空
    var systemSetIsNull = false;

    // TODO 测试
    username = 'test';

    console.log('getSystem begin:', username);
    $http.post(urlGetSystem, {
      username: username,
      method: 'getSystem'
    }).success(function (response) {
      console.log('getSystem success:', response);
      if (response.msgcode == 1) {
        $scope.settingSystemData.orgcode = parseInt(response.msgmain.orgcode);
        $scope.settingSystemData.shopcode = parseInt(response.msgmain.shopcode);
      } else {
        // 系统设置信息为空
        systemSetIsNull = true;
      }
    }).error(function () {
      console.log('getPerson fail:', '网络异常');
      $ionicPopup.alert({
        title: '提示',
        template: '网络异常',
        okText: '确定'
      });
    });

    // 点击修改按钮
    $scope.settingSystemModify = function () {
      $scope.settingSystemBtnModify = false;
      $scope.settingSystemBtnConfirm = true;
    };

    //点击取消按钮
    $scope.settingSystemCancel = function () {
      location.reload();
    };

    // 点击确认按钮
    $scope.settingSystem = function () {
      if ($scope.settingSystemData.orgcode == '' || $scope.settingSystemData.orgcode == null ||
        $scope.settingSystemData.orgcode == undefined || $scope.settingSystemData.shopcode == '' ||
        $scope.settingSystemData.shopcode == null || $scope.settingSystemData.shopcode == undefined) {
        $ionicPopup.alert({
          title: '提示',
          template: '系统信息不能为空',
          okText: '确定'
        });
        return false;
      }
      if ($scope.settingSystemData.orgcode.toString().length != 6 ||
        $scope.settingSystemData.shopcode.toString().length != 6) {
        $ionicPopup.alert({
          title: '提示',
          template: '请输入6位组织代码',
          okText: '确定'
        });
        return false;
      }

      console.log('settingSystem start:', $scope.settingSystemData);
      $http.post(urlSettingSystem, {
        data: $scope.settingSystemData,
        username: username,
        systemNull: systemSetIsNull,
        method: 'settingSystem'
      }).success(function (response) {
        console.log('settingSystem success:', response);
        if (response.msgcode == 1) {
          $scope.settingSystemBtnConfirm = false;
          $scope.settingSystemBtnModify = true;
          $ionicPopup.alert({
            title: '提示',
            template: '修改成功',
            okText: '确定'
          });
        } else {
          // alert(response.msgmain);
          $ionicPopup.alert({
            title: '提示',
            template: response.msgmain,
            okText: '确定'
          });
        }
      }).error(function () {
        console.log('settingSystem fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      })
    };
  })

  /**
   * setting-app.html
   */
  .controller('settingAppCtrl', function ($scope) {
  })

  /**
   * setting-app-feedback.html
   */
  .controller('feedbackCtrl', function ($scope, $http, $ionicPopup) {
    $scope.feedbackData = {};

    // TODO 测试
    username = 'test';

    // 点击提交按钮
    $scope.feedback = function () {
      if ($scope.feedbackData.problem == '' || $scope.feedbackData.problem == null ||
        $scope.feedbackData.problem == undefined) {
        $ionicPopup.alert({
          title: '提示',
          template: '反馈信息不能为空',
          okText: '确定'
        });
        return false;
      }
      if (!($scope.feedbackData.phone == '' || $scope.feedbackData.phone == null
        || $scope.feedbackData.phone == undefined) &&
        $scope.feedbackData.phone.toString().length != 11) {
        $ionicPopup.alert({
          title: '提示',
          template: '手机号码格式错误',
          okText: '确定'
        });
        return false;
      }

      console.log('feedback start:', $scope.feedbackData);
      $http.post(urlFeedback, {
        data: $scope.feedbackData,
        username: username,
        method: 'feedback'
      }).success(function (response) {
        console.log('feedback success:', response);
        if (response.msgcode == 1) {
          $ionicPopup.alert({
            title: '提示',
            template: '反馈成功',
            okText: '确定'
          });
          $scope.feedbackData.problem = '';
          $scope.feedbackData.phone = '';
          // location.reload();
        } else {
          // alert(response.msgmain);
          $ionicPopup.alert({
            title: '提示',
            template: response.msgmain,
            okText: '确定'
          });
        }
      }).error(function () {
        console.log('feedback fail:', '网络异常');
        $ionicPopup.alert({
          title: '提示',
          template: '网络异常',
          okText: '确定'
        });
      })
    };
  });

/**
 * 格式化日期
 *
 * @param date 需要格式化的日期
 *
 * @return date 格式化后的日期
 */
function formatDate(date) {
  if (date == null || date == '' || date == undefined) {
    date = new Date();
  }

  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  month = formatNumber(month, 2, '0', 'l');
  var day = date.getDate();
  day = formatNumber(day, 2, '0', 'l');
  var hour = date.getHours();
  hour = formatNumber(hour, 2, '0', 'l');
  var minute = date.getMinutes();
  minute = formatNumber(minute, 2, '0', 'l');
  date = year + month + day + hour + minute;

  return date;
}

/**
 * 格式化数值为指定长度
 *
 * @param number 需要格式化的数值
 * @param n 格式化后的长度
 * @param c 不足长度需要填充的字符
 * @param p 在原数值哪一侧填充字符
 *          l:左侧；r:右侧
 *
 * @return 格式化后的数值
 */
function formatNumber(number, n, c, p) {
  var length = number.toString().length;
  while (length < n) {
    if (p == 'l') {
      number = c + number;
    } else {
      number = number + c;
    }
    length++;
  }

  return number
}
