(function ($) {
    $.fn.ajax_error_alert = alert;


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

            $.fn.ajax_error(decodeURIComponent(reason));
        }
    });
})($);