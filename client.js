(function ($) {
    $.fn.ajax_error = function (reason) {
        var view = document.createElement('div');

        view.innerText = reason;
        view.style.color = '#FFF';
        view.style.zIndex = '999999999';
        view.style.position = 'fixed';
        view.style.top = '-50px';
        view.style.width = '100%';
        view.style.backgroundColor = '#E1715B';
        view.style.textAlign = 'center';
        view.style.cursor = 'pointer';

        var height = '50px';
        view.style.lineHeight = height;
        view.style.height = height;

        var transition = 'all 0.5s ease';
        view.style.transition = transition;
        view.style.MozTransition = transition;
        view.style.WebkitTransition = transition;

        document.body.appendChild(view);

        setTimeout(function () {
            view.style.top = '0px';
            view.style.opacity = 1;
        }, 100);

        setTimeout(function () {
            view.style.top = '-50px';
            view.style.opacity = 0.3;
        }, 3100);

        setTimeout(function () {
            document.body.removeChild(view);
        }, 4000)
    };

    $.ajaxSetup({
        error: function (xhr) {
            var failed = 0 === xhr.status && 0 === xhr.readyState;

            if ( failed && 'abort' === xhr.statusText) return;

            var reason;
            if ( failed && 'error' === xhr.statusText) {
                reason = '网络错误，请检查本地网络链接';
            } else {
                reason = xhr.getResponseHeader('X-Error-Description');
            }

            $.fn.ajax_error(reason);
        }
    });
})($);