// What happens when a plan is clicked on the pricing pages (inlined into the second embed by build.mjs).
// __ENTERPRISE_ID__, __ENTERPRISE_URL__ and __FREE_ID__ are filled in at build time.
(function () {
  var table = document.querySelector('pricing-table');
  table.addEventListener('productClicked', function (event) {
    if (event.detail.id === '__ENTERPRISE_ID__') {
      window.location.href = '__ENTERPRISE_URL__';
      return;
    }
    var origin = new URL(window.location.href).searchParams.get('origin') || 'https://app.prysmex.com';
    var register = origin + '/register';
    if (event.detail.price.product === '__FREE_ID__') {
      window.open(register, '_self');
    } else {
      window.open(register + "?qs=(price_id:'" + event.detail.price.id + "')", '_self');
    }
  });
})();
