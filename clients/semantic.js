$.fn.api.ajax_error_alert = alert;
$.fn.api.settings.onError = function(message, ele, xhr) {
    reason = xhr.getResponseHeader('X-Error-Description');
    reason = decodeURIComponent(reason)

    $.fn.api.ajax_error_alert(reason);
    return false;
};