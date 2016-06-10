$(function () {
    var yOffset = 0;

    function disableScrolling() {
        yOffset = $(window).scrollTop();
        $('body').css({
            'position': 'fixed',
            'margin-top': -1 * yOffset,
            'width': '100%',
            'overflow-y': 'hidden'
        });
    }

    function enableScrolling() {
        $('body').css({
            'position': 'relative',
            'margin-top': 0,
            'width': 'auto',
            'overflow-y': 'visible'
        });
        $(window).scrollTop(yOffset);
    }

    function closeNav() {
        var body = $('.body');
        var actions = $('.header__actions');
        var nav = $('.header__nav--tablet');
        TweenLite.to(actions, 0.3, {transform: "translateX(0px)", ease: Power1.easeInOut});
        TweenLite.to(body, 0.3, {transform: "translateX(0px)", ease: Power1.easeInOut});
        TweenLite.to(nav, 0.3, {transform: "translateX(300px)", ease: Power1.easeInOut});
        enableScrolling();

        $(window).off('swiperight');
    }

    $('.header__hamburger').on('click tap', function (event) {
        var body = $('.body');
        var actions = $('.header__actions');
        var nav = $('.header__nav--tablet');
        disableScrolling();
        TweenLite.to(actions, 0.3, {transform: "translateX(-200px)", ease: Power1.easeInOut});
        TweenLite.to(body, 0.3, {transform: "translateX(-250px)", ease: Power1.easeInOut});
        TweenLite.to(nav, 0.3, {transform: "translateX(50px)", ease: Power1.easeInOut});

        $(window).on('swiperight', closeNav);
        event.preventDefault(); // Only call this handler once per tap/click
    });

    $('.header__close').on('click tap', function (event) {
        closeNav();
        event.preventDefault(); // Only call this handler once per tap/click
    });

    function resetSubmenu(submenu) {
        TweenLite.to(submenu, 0, {left: "0px", top: "4px"});
    }

    function slideDownSubmenu(submenu) {
        TweenLite.fromTo(submenu, 0.6, {
            left: "0px", top: "4px"
        }, {
            left: "0px", top: "74px", ease: Power1.easeInOut
        });
    }

    function slideUpSubmenu(submenu) {
        if (TweenLite.getTweensOf(submenu, 1).length == 0) {
            TweenLite.fromTo(submenu, 0.6, {
                left: "0px", top: "74px"
            }, {
                left: "0px", top: "4px", ease: Power1.easeInOut
            });
        } else {
            TweenLite.to(submenu, 0.6, {
                left: "0px", top: "4px", ease: Power1.easeInOut
            });
        }
    }

    function slideOutSubmenu(submenu) {
        var distanceOffScreen = -1 * (submenu.offset().left + submenu.width());
        if (TweenLite.getTweensOf(submenu, 1).length == 0) {
            TweenLite.fromTo(submenu, 0.6, {
                left: "0px", top: "74px"
            }, {
                left: distanceOffScreen + "px", top: "74px", ease: Power1.easeInOut, onComplete: function () {
                    resetSubmenu(submenu);
                }
            });
        } else // If the current submenu isn't done sliding down, just reset it and let the new submenu slide down
            resetSubmenu(submenu);
    }

    // On mouse enter of a valid nav item, scroll the body down and scroll the appropriate submenu down from the top
    // On mouse leave of the same nav item AND the submenu, scroll the submenu and the body back up
    $('.header__nav-item, .header__submenu').mouseenter(function (event) {
        var selected = $(event.currentTarget);
        var submenu = $('.header__submenu[name="' + selected.attr('name') + '"]');

        // Only scroll down the submenu if the mouse is coming from a nav item and the submenu exists
        if (selected.is('li') && submenu.length && !selected.hasClass('selected')) {
            selected.addClass('selected');

            // Scroll down body
            TweenLite.to($('.body'), 0.6, {y: "70px", ease: Power1.easeInOut});

            // Scroll down submenu background
            TweenLite.to($('.header__submenu-background'), 0.6, {top: "74px", ease: Power1.easeInOut});

            // Scroll down submenu
            slideDownSubmenu(submenu);
        }
    });

    $('.header__nav-item, .header__submenu').mouseleave(function (event) {
        if ($(event.toElement).is('a') && $(event.toElement.parentElement).is('li')) {
            // Specifically main menu links
            var to = $(event.toElement.parentElement);
        } else if (event.toElement)
        // Anything on the submenu will have the .header__submenu element as the offsetParent
        // Don't scroll up if mouse hits the submenu background before hitting the submenu
        // (if the submenu has yet to scroll down before the submenu background does)
            var to = $(event.toElement.offsetParent);
        else
            var to = $(event.toElement);

        var selected = $('.selected');

        // Don't do anything if the mouse has entered a DOM element in the middle of an animation
        if (to.attr('name') != selected.attr('name') && TweenLite.getTweensOf(to, 1).length == 0) {
            selected.removeClass('selected');

            if (to.attr('name')) {
                // Scroll sideways if mouse is within a new nav item
                slideOutSubmenu($('.header__submenu[name="' + selected.attr('name') + '"]'));
            } else {
                // Only scroll up the submenu if mouse is not within the selected nav item or corresponding submenu
                TweenLite.to($('.body'), 0.6, {y: "0", ease: Power1.easeInOut});

                // Scroll up submenu
                slideUpSubmenu($('.header__submenu[name="' + selected.attr('name') + '"]'));

                // Scroll up submenu background
                TweenLite.to($('.header__submenu-background'), 0.6, {top: "4px", ease: Power1.easeInOut});
            }
        }
    });

    function resizeGrid () {
        $('.person').css('max-width', 'none');
        var width = $($('.managements__people .person')[0]).width();
        $('.person').css('max-width', width);
    }

    resizeGrid();

    $(window).resize(function () {
        resizeGrid();
    });
});