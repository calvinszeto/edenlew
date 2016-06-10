// Moves the Related Managements section horizontally
function shiftElement(element, shiftAmount) {
    // Expected value of CSS 'transform' is a string of format
    // "matrix(scaleX, skewY, skewX, scaleY, translateX, translateY)"
    var matrix = $('.management__related').css('transform');
    var transform = /matrix.+,.+,.+,.+,(.+),.+/.exec(matrix);
    if (transform && transform.length > 1) {
        var newTransform = parseInt(transform[1]) + shiftAmount;
    } else {
        var newTransform = shiftAmount;
    }

    // The width of the viewable portion
    var containerWidth = $('.management__related-container').width();
    var end = -1 * element.width();
    // Don't scroll past the end
    if (newTransform <= end)
        newTransform = transform[1];
    // Don't scroll past the beginning
    if (newTransform > 0)
        newTransform = 0;

    // Disable the icons if the end has been reached
    var buttonPrev = $('.management__prev img');
    var buttonNext = $('.management__next img');
    if (newTransform - containerWidth <= end) // If scrolling again would go past the end
        buttonNext.attr('src', '../images/icon-right-disabled.svg');
    else
        buttonNext.attr('src', '../images/icon-right.svg');
    if (newTransform == 0)
        buttonPrev.attr('src', '../images/icon-left-disabled.svg');
    else
        buttonPrev.attr('src', '../images/icon-left.svg');

    // Set the translateX value and keep everything else normal
    element.css('-webkit-transform', "matrix(1, 0, 0, 1, " + newTransform + ",0)");
    element.css('transform', "matrix(1, 0, 0, 1, " + newTransform + ",0)");
}

$(function () {
    // Remove the animation so it doesn't trigger on the first shifting of the related managements
    var currentAnimation = $('.management__related').css('transition');
    $('.management__related').css('transition', 'none');

    // Start off Related Managements to show the current person
    var currentPerson = $('#current-person');
    shiftElement($('.management__related'), -1 * currentPerson.position().left);

    $('.management__prev').click(function () {
        $('.management__related').css('transition', currentAnimation);
        shiftElement($('.management__related'), $('.management__related-container').width());
    });

    $('.management__next').click(function () {
        $('.management__related').css('transition', currentAnimation);
        shiftElement($('.management__related'), -1 * $('.management__related-container').width());
    });
});
