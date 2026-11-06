// What happens when a plan is clicked on the pricing pages (inlined into the second embed by build.mjs).
// __ENTERPRISE_URL__ is filled in at build time. Plans are told apart by name: their ids change per environment.
(function () {
  var table = document.querySelector('pricing-table');
  table.addEventListener('productClicked', function (event) {
    if (event.detail.name === 'Enterprise') {
      window.location.href = '__ENTERPRISE_URL__';
      return;
    }
    var origin = new URL(window.location.href).searchParams.get('origin') || 'https://app.prysmex.com';
    var register = origin + '/register';
    if (event.detail.name === 'Free') {
      window.open(register, '_self');
    } else {
      window.open(register + "?qs=(price_id:'" + event.detail.price.id + "')", '_self');
    }
  });
})();
