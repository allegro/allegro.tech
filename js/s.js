/*jshint multistr: true */
(function() {
    function initShareWidget() {
        // share
        [].slice.call(document.querySelectorAll('a.share-button')).forEach(function(item) {
            item.addEventListener('click', function(e) {
                window.open(this.href, 'share', 'width=500,height=296');
                e.preventDefault();
            }, false);
        });
    }

    initShareWidget();
})();
