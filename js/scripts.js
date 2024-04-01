$(function () {

    "use strict";

    /* Preloader script */
    var width = 100,
        perfData = window.performance.timing,
        EstimatedTime = -(perfData.loadEventEnd - perfData.navigationStart),
        time = parseInt((EstimatedTime / 1000) % 60, 10) * 100,
        id = $('#load-percent'),
        start = 0,
        end = 100,
        duration = time;

    function animateValue(id, start, end, duration) {

        var range = end - start,
            current = start,
            increment = end > start ? 1 : -1,
            stepTime = Math.abs(Math.floor(duration / range)),
            obj = $(id);

        var timer = setInterval(function () {
            current += increment;
            $(obj).text(current);
            obj.innerHTML = current;
            if (current == end) {
                clearInterval(timer);
            }
        }, stepTime);

    }

    animateValue(id, start, end, duration);

    $('#load-bar').animate({
        width: width + "%"
    }, time);

    setTimeout(function () {

        $('#preloader').addClass('close');
        $('.loader-wrap').addClass('fade-out');

        if (!jQuery.browser.mobile) {
            if ($('#super-cursor').data('active')) {
                $('#super-cursor').removeClass('hidden-super-cursor');
            }
        }

        if ($('#site-header').data('classic-menu')) {
            $('#site-header').addClass('classic-menu');
            setMobileDeviceMenu();
        } else {
            $('#site-header').addClass('full-screen-menu');
        }

        if (!jQuery.browser.mobile && $('#site-header').data('classic-menu') && $('#site-header').data('top-bar')) {
            $('#site-header .top-bar').addClass('is-active');
        } else {
            $('#site-header .top-bar').removeClass('is-active');
        }

        setTimeout(function () {
            $('html').removeClass('overflow-heading');
        }, 1500)

    }, time);


    /* Init ScrollMagic controller */
    var controller = new ScrollMagic.Controller();

    if (!jQuery.browser.mobile && $('#site-header').data('classic-menu') && $('#site-header').data('top-bar')) {
        var topBarElement = $('#site-header .top-bar');

        new ScrollMagic.Scene({
            triggerElement: '#site-content',
            triggerHook: 0,
            offset: '30px'
        }).on('start', function (e) {
            if (e.progress) {
                topBarElement.addClass('is-hidden').slideUp(300, function () {
                    topBarElement.css({'display': 'none'})
                });
            } else {
                topBarElement.removeClass('is-hidden').slideDown(200);
            }
        }).addTo(controller);
    }

    /* Super Cursor */
    if (!jQuery.browser.mobile) {

        if ($('#super-cursor').data('active')) {
            var mouse = {x: 0, y: 0},
                pos = {x: 0, y: 0},
                ratio = 0.15,
                active = false,
                ball = document.getElementById('ball'),
                ballLoader = document.getElementById('ball-loader');

            var mouseMove = function (e) {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            }

            document.addEventListener('mousemove', mouseMove);

            var updatePosition = function () {
                if (!active) {
                    pos.x += (mouse.x - pos.x) * ratio;
                    pos.y += (mouse.y - pos.y) * ratio;

                    gsap.set([ball, ballLoader], {top: pos.y, left: pos.x});
                }
            }

            gsap.ticker.add(updatePosition);

            $(document).on('mouseover mouseenter', '.link, .ajax-link', function () {
                $('#ball').removeClass().addClass('hover-link');
            });

            $(document).on('mouseout mouseleave', '.link, .ajax-link', function () {
                $('#ball').removeClass('hover-link');
            });

            $(document).on('mousemove mouseover mouseenter', '.link-label', function () {
                var ballLabel = $('#ball .cursor-label'),
                    cursorLabel = $(this).data('cursor-label')

                ballLabel.html(cursorLabel);
                $('#ball').removeClass().addClass('hover-link-label');
            });

            $(document).on('mouseout mouseleave', '.link-label', function () {
                var ballLabel = $('#ball .cursor-label');

                ballLabel.html('');
                $('#ball').removeClass('hover-link-label');
            });

            $(document).on('mouseover mouseenter', '.gallery .gallery-item', function () {
                $('#ball').removeClass().addClass('zoom-cursor');
            });

            $(document).on('mouseout mouseleave', '.gallery .gallery-item', function () {
                $('#ball').removeClass('zoom-cursor');
            });

            $(document).on('mouseover mouseenter', '.gallery .grid-random-wrap', function (e) {
                if (e.target.classList.contains('grid-random-wrap')) {
                    $('#ball').removeClass().addClass('random-cursor');
                }
            });

            $(document).on('mouseout mouseleave', '.gallery .grid-random-wrap', function () {
                $('#ball').removeClass('random-cursor');
            });

            $(document).on('mouseover mouseenter', '.slider-handle', function () {
                $('#ball').addClass('drag-cursor');
            });

            $(document).on('mouseout mouseleave', '.slider-handle', function () {
                $('#ball').removeClass('drag-cursor');
            });
        }
    }


    /* Ajax Page Transition */
    var isAnimating = false,
        newLocation = '',
        firstLoad = false;

    // Trigger smooth transition from the actual page to the new one
    $('#site-content').on('click', '[data-type="page-transition"]', function (event) {
        event.preventDefault();

        // Detect which page has been selected
        var newPage = $(this).attr('href');

        // If the page is not already being animated - trigger animation
        if (!isAnimating) {
            changePage(newPage, true);
        }
        firstLoad = true;
    });

    // Detect the 'popstate' event - e.g. user clicking the back button
    $(window).on('popstate', function () {
        if (firstLoad) {

            /* Safari emits a popstate event on page load - check if firstLoad is true before animating
             if it's false - the page has just been loaded */
            var newPageArray = location.pathname.split('/'),

                // This is the url of the page to be loaded
                newPage = newPageArray[newPageArray.length - 1];

            if (!isAnimating && newLocation != newPage) {
                changePage(newPage, false);
            }
        }
        firstLoad = true;
    });

    function changePage(url, bool) {
        isAnimating = true;

        // Trigger page animation
        $('#ball').removeClass();
        $('body').addClass('page-is-changing');
        $('.hidden-cover-layer').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
            loadNewContent(url, bool);
            newLocation = url;
            $('.hidden-cover-layer').off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend');
        });

        // If browser doesn't support CSS transitions
        if (!transitionsSupported()) {
            loadNewContent(url, bool);
            newLocation = url;
        }
    }

    function loadNewContent(url, bool) {
        url = ('' == url) ? 'index.html' : url;

        var section = $('<div class="ajax-inserted-content"></div>');

        section.load(url + ' .ajax-inserted-content > *', function (event) {

            var html = $.parseHTML(event),
                title = event.match(/<title[^>]*>([^<]+)<\/title>/)[1],
                bodyClass = '',
                classicMenu = $(html).find('.main-nav-classic .main-menu'),
                fullScreenMenu = $(html).find('.main-nav-full-screen .main-menu'),
                contactsData = $(html).find('.main-nav-full-screen .contacts-data');

            if (event.match(/body[^>]*/)[0].match(/class="([^"]*)"/)) {
                bodyClass = event.match(/body[^>]*/)[0].match(/class="([^"]*)"/)[1];
            }

            $('head title').html(title);

            $('.main-nav-classic').html(classicMenu);
            $('.main-nav-classic').append('<div class="menu-cover-layer"></div>');

            $('.main-nav-full-screen .col-auto').html(fullScreenMenu).append(contactsData);

            // Load new content and replace <main> content with the new one
            $('#site-main').html(section);

            // If browser doesn't support CSS transitions - dont wait for the end of transitions
            var delay = ( transitionsSupported() ) ? 300 : 0;

            setTimeout(function () {
                // Wait for the end of the transition on the loading bar before revealing the new content
                $('body').removeClass('page-is-changing');
                $('#site-content').removeClass().addClass(bodyClass);
                $('.hidden-cover-layer').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
                    isAnimating = false;
                    $('.hidden-cover-layer').off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend');
                });

                if (!transitionsSupported()) {
                    isAnimating = false;
                }
            }, delay);

            if (url != window.location && bool) {

                // Add the new page to the window.history
                // If the new page was triggered by a 'popstate' event, don't add it
                window.history.pushState({path: url}, '', url);
            }

            $('#ball').removeClass();

            closeFullScreenMenu();
            closeLightBox();
            destroyComingSoon();

            initAppComponents();
        });
    }

    function transitionsSupported() {
        return $('html').hasClass('csstransitions');
    }


    /* Full Screen Menu */
    function setMobileDeviceMenu() {
        if (jQuery.browser.mobile) {
            $('#site-header').removeClass('classic-menu').addClass('full-screen-menu');
        } else {
            $('#site-header').removeClass('full-screen-menu').addClass('classic-menu');
        }
    }

    function openFullScreenMenu() {
        $('html').addClass('overflow-heading');
        $('#site-content').addClass('modal-is-open');
        $('.menu-button').addClass('hide-button');
        $('.main-nav-full-screen').addClass('is-open');
        gsap.fromTo('.main-nav-full-screen ul.main-menu > li', {x: -40, y: 0, opacity: 0,}, {
                x: 0, y: 0, opacity: 1, duration: 0.2, delay: 0.3, stagger: 0.1,
                onComplete: function () {
                    $('.close-menu-button').removeClass('hide-button');
                }
            }
        );
        gsap.fromTo('.contacts-data', {x: -40, y: 0, opacity: 0,}, {
            x: 0,
            y: 0,
            opacity: 1,
            duration: 0.2,
            delay: 0.5,
        });
    }

    function closeFullScreenMenu() {
        if ($('.main-nav-full-screen').hasClass('is-open')) {
            var setDelayToCloseSubMenu = 0;
            $('.close-menu-button').addClass('hide-button');
            if ($('.main-nav-full-screen').find('.is-open').length) {
                $('.main-nav-full-screen').find('ul.sub-menu').slideUp(100, 'linear').toggleClass('is-open');
                setDelayToCloseSubMenu = 0.3;
            }
            gsap.fromTo('.main-nav-full-screen ul.main-menu > li', {x: 0, y: 0, opacity: 1}, {
                    x: -40, y: 0, opacity: 0, duration: 0.2, delay: setDelayToCloseSubMenu, stagger: 0.1,
                    onComplete: function () {
                        $('#site-content').removeClass('modal-is-open');
                        $('.menu-button').removeClass('hide-button')
                        $('.main-nav-full-screen').removeClass('is-open');
                        setTimeout(function () {
                            $('html').removeClass('overflow-heading');
                        }, 300);
                    }
                }
            );
            gsap.fromTo('.contacts-data', {x: 0, y: 0, opacity: 1}, {
                x: -40,
                y: 0,
                opacity: 0,
                duration: 0.2,
                delay: 0.5,
            });
        }
    }

    $('.menu-button').on('click', openFullScreenMenu);

    $('.close-menu-button').on('click', closeFullScreenMenu);

    function fullScreenMenuInit() {
        $('.main-nav-full-screen .menu-item-has-children a').on('click', function (e) {

            var $this = $(this),
                $parent = $this.parent();

            if ($parent.hasClass('.menu-item-has-children') || $parent.find('ul').length) {
                e.preventDefault();
                e.stopPropagation();
                $parent.children('ul').slideToggle(200, 'linear').toggleClass('is-open');
            }
        });
    }


    /* Swiper Slider */
    function setSwiperSliderNavigation(screenTarget, thisSlider) {
        var thisScreenWidth = screenTarget.width();
        screenTarget.on('click', function (e) {
            if (thisScreenWidth / 2 < e.pageX) {
                thisSlider.slideNext();
            } else {
                thisSlider.slidePrev();
            }
        });
    }

    function removeStyleFromCursor(screenTarget) {
        screenTarget.on('mouseout mouseleave', function (e) {
            $('#ball').removeClass();
        });
    }


    function setStyleForButtonPrevNext(screenTarget, thisSlider) {
        var isSetSwiperSliderLoop = screenTarget.data('swiper-loop'),
            thisScreenWidth = screenTarget.width();

        screenTarget.on('mousemove', function (e) {
            if (!e.target.classList.contains('ajax-link')) {
                if (!isSetSwiperSliderLoop) {
                    if (thisSlider.isBeginning) {
                        $('#ball').addClass('is-beginning');
                    } else {
                        $('#ball').removeClass('is-beginning');
                    }

                    if (thisSlider.isEnd) {
                        $('#ball').addClass('is-end')
                    } else {
                        $('#ball').removeClass('is-end');
                    }
                }

                if (thisScreenWidth / 2 < e.pageX) {
                    $('#ball').removeClass('prev-button').addClass('next-button');
                } else {
                    $('#ball').removeClass('next-button').addClass('prev-button');
                }
            }
        });

        removeStyleFromCursor(screenTarget);
    }

    function setStyleForDragButton(screenTarget, thisSlider, sliderNavigation = false) {
        var isSetSwiperSliderLoop = screenTarget.data('swiper-loop'),
            thisScreenWidth = screenTarget.width();

        screenTarget.on('mousedown', function () {
            $(screenTarget).off('mousemove');

            if (!isSetSwiperSliderLoop) {
                if (thisSlider.isBeginning) {
                    $('#ball').addClass('is-beginning');
                } else {
                    $('#ball').removeClass('is-beginning');
                }

                if (thisSlider.isEnd) {
                    $('#ball').addClass('is-end')
                } else {
                    $('#ball').removeClass('is-end');
                }
            }

            $('#ball').removeClass('next-button prev-button').addClass('drag-cursor');
        });

        screenTarget.on('mouseup', function (e) {
            if (sliderNavigation) {
                if (thisScreenWidth / 2 < e.pageX) {
                    $('#ball').removeClass('drag-cursor').addClass('next-button');
                } else {
                    $('#ball').removeClass('drag-cursor').addClass('prev-button');
                }

                setStyleForButtonPrevNext(screenTarget, thisSlider);
            } else {
                $('#ball').removeClass('drag-cursor');
            }
        });

        removeStyleFromCursor(screenTarget)
    }

    function setMousewheelControll(screenTarget, thisSlider) {
        var allowTransitionLeft = true,
            allowTransitionRight = true;

        // Firefox
        screenTarget.on('DOMMouseScroll', function (e) {
            if (e.originalEvent.detail > 0) {
                if (allowTransitionRight) {
                    allowTransitionRight = false;
                    thisSlider.slideNext();
                }
            } else {
                if (allowTransitionLeft) {
                    allowTransitionLeft = false;
                    thisSlider.slidePrev();
                }
            }
            e.preventDefault();

            thisSlider.on('transitionEnd', function () {
                allowTransitionLeft = true;
                allowTransitionRight = true;
            });
        });

        // Chrome, IE
        screenTarget.on('mousewheel', function (e) {
            if (e.originalEvent.wheelDelta > 0) {
                if (allowTransitionLeft) {
                    allowTransitionLeft = false;
                    thisSlider.slidePrev();
                }
            } else {
                if (allowTransitionRight) {
                    allowTransitionRight = false;
                    thisSlider.slideNext();
                }
            }
            e.preventDefault();

            thisSlider.on('transitionEnd', function () {
                allowTransitionLeft = true;
                allowTransitionRight = true;
            });
        });
    }

    var isPlayingVideo = false;

    function playVideoInActiveSlide() {
        var currentVideoBackgroundSlide = $('.swiper-slide-active').find('.video-background'),
            isVideoBackgroundSlide = $('.swiper-slide-active').find('.video-background').length;
        if (isVideoBackgroundSlide) {
            var playVideoPromise = currentVideoBackgroundSlide.get(0).play();
            if (playVideoPromise !== undefined) {
                playVideoPromise.then(() => {
                    currentVideoBackgroundSlide.get(0).play();
                    isPlayingVideo = true;
                }).catch(() => {
                    isPlayingVideo = false;
                });
            }
        } else {
            if (isPlayingVideo) {
                $('.video-background').each(function () {
                    $(this).get(0).pause();
                });
            }
        }
    }


    /* Scroll First Screen */
    function scrollFirstScreenInit() {
        if ($('.scroll-indicator-btn').length) {

            $(document).on('click', '.scroll-indicator-btn', function () {
                var screenHeight = $('.fullscreen').height();

                $('html, body').animate({
                    scrollTop: screenHeight,
                }, 800);
            });

        }
    }


    /* Swiper Fullscreen Slider */
    function fullScreenSliderInit() {
        if ($('.fullscreen-slider').length) {

            // Set Swiper Variables
            var fullScreenSlider = $('.fullscreen-slider'),
                swiperMousewheel = fullScreenSlider.data('swiper-mousewheel'),
                swiperNavigation = fullScreenSlider.data('swiper-navigation'),
                swiperPagination = fullScreenSlider.data('swiper-pagination'),
                swiperLoop = fullScreenSlider.data('swiper-loop'),
                swiperSpeed = fullScreenSlider.data('swiper-speed'),
                swiperAutoplay = fullScreenSlider.data('swiper-autoplay') ? {delay: fullScreenSlider.data('swiper-autoplay')} : fullScreenSlider.data('swiper-autoplay'),
                swiperEffect = fullScreenSlider.data('swiper-effect') ? fullScreenSlider.data('swiper-effect') : 'slide';

            // Set Swiper Slider
            var fullScreenSwiperSlider = new Swiper('.fullscreen-slider', {
                loop: swiperLoop,
                speed: swiperSpeed,
                autoplay: swiperAutoplay,
                effect: swiperEffect,
                grabCursor: swiperNavigation,
                allowTouchMove: swiperNavigation,
                lazy: {
                    loadPrevNext: true,
                },
                pagination: {
                    el: '.swiper-pagination',
                    type: 'fraction',
                    renderFraction: function (currentClass, totalClass) {
                        return '<span class="' + currentClass + '"></span>' +
                            '<span class="swiper-pagination-separator"></span>' +
                            '<span class="' + totalClass + '"></span>';
                    }
                }
            });

            // Mousewheel Control
            if (swiperMousewheel) {
                setMousewheelControll(fullScreenSlider, fullScreenSwiperSlider);
            }

            // Navigation Control
            if (swiperNavigation) {
                setSwiperSliderNavigation(fullScreenSlider, fullScreenSwiperSlider);
                setStyleForButtonPrevNext(fullScreenSlider, fullScreenSwiperSlider);

                // Drag Button
                setStyleForDragButton(fullScreenSlider, fullScreenSwiperSlider, swiperNavigation);
            }

            // Pagination
            if (swiperPagination) {
                $('.swiper-pagination').addClass('is-visible');
            } else {
                $('.swiper-pagination').removeClass('is-visible');
            }

            // Play Video in Active Slide
            playVideoInActiveSlide();
            fullScreenSwiperSlider.on('slideChangeTransitionEnd', function () {
                playVideoInActiveSlide();
            });
        }
    }


    /* Swiper Split Slider */
    function splitSliderInit() {
        if ($('.split-slider').length) {

            // Set Swiper Variables
            var splitSlider = $('.split-slider'),
                swiperMousewheel = splitSlider.data('swiper-mousewheel'),
                swiperNavigation = splitSlider.data('swiper-navigation'),
                swiperPagination = splitSlider.data('swiper-pagination'),
                swiperLoop = splitSlider.data('swiper-loop'),
                swiperSpeed = splitSlider.data('swiper-speed'),
                swiperAutoplay = splitSlider.data('swiper-autoplay') ? {delay: splitSlider.data('swiper-autoplay')} : splitSlider.data('swiper-autoplay'),
                swiperEffect = splitSlider.data('swiper-effect') ? splitSlider.data('swiper-effect') : 'slide';

            // Set Swiper Slider
            var splitSwiperSlider = new Swiper('.split-slider', {
                loop: swiperLoop,
                speed: swiperSpeed,
                autoplay: swiperAutoplay,
                effect: swiperEffect,
                grabCursor: swiperNavigation,
                allowTouchMove: swiperNavigation,
                lazy: {
                    loadPrevNext: true,
                },
                pagination: {
                    el: '.swiper-pagination',
                    type: 'fraction',
                    renderFraction: function (currentClass, totalClass) {
                        return '<span class="' + currentClass + '"></span>' +
                            '<span class="swiper-pagination-separator"></span>' +
                            '<span class="' + totalClass + '"></span>';
                    }
                }
            });

            // Mousewheel Control
            if (swiperMousewheel) {
                setMousewheelControll(splitSlider, splitSwiperSlider);
            }

            // Navigation Control
            if (swiperNavigation) {
                setSwiperSliderNavigation(splitSlider, splitSwiperSlider);
                setStyleForButtonPrevNext(splitSlider, splitSwiperSlider);

                // Drag Button
                setStyleForDragButton(splitSlider, splitSwiperSlider, swiperNavigation);
            }

            // Pagination
            if (swiperPagination) {
                setTimeout(function () {
                    $('#site-footer').removeClass('split-slider-active');
                    if (!$('#site-content').hasClass('is-scrollable-page')) {
                        $('#site-footer').addClass('split-slider-active');
                    }
                    $('.swiper-pagination').addClass('is-visible');
                }, 600);
            } else {
                $('.swiper-pagination').removeClass('is-visible');
                $('#site-footer').removeClass('split-slider-active');
            }

            // Play Video in Active Slide
            playVideoInActiveSlide();
            splitSwiperSlider.on('slideChangeTransitionEnd', function () {
                playVideoInActiveSlide();
            });
        } else {
            $('#site-footer').removeClass('split-slider-active');
        }
    }


    /* Swiper Small Carousel */
    function smallCarouselInit() {
        if ($('.small-carousel').length) {

            // Set Swiper Variables
            var smallCarousel = $('.small-carousel'),
                swiperMousewheel = smallCarousel.data('swiper-mousewheel'),
                swiperNavigation = smallCarousel.data('swiper-navigation'),
                swiperPagination = smallCarousel.data('swiper-pagination'),
                swiperOneSlideVisibility = smallCarousel.data('swiper-one-slide-visibility'),
                swiperScrollbar = smallCarousel.data('swiper-scrollbar'),
                swiperSpeed = smallCarousel.data('swiper-speed'),
                swiperAutoplay = smallCarousel.data('swiper-autoplay') ? {delay: smallCarousel.data('swiper-autoplay')} : smallCarousel.data('swiper-autoplay');

            if (swiperOneSlideVisibility) {
                smallCarousel.addClass('swiper-one-slide-visibility');
            }

            // Set Swiper Slider
            var smallCarouselSwiperSlider = new Swiper('.small-carousel', {
                speed: swiperSpeed,
                autoplay: swiperAutoplay,
                grabCursor: true,
                centeredSlides: true,
                slidesPerView: 1,
                breakpoints: {
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 30,
                    },
                    1024: {
                        slidesPerView: 2,
                        spaceBetween: 60,
                    },
                    1380: {
                        slidesPerView: 2,
                        spaceBetween: 90,
                    },
                    2500: {
                        slidesPerView: 4,
                        spaceBetween: 120,
                    }
                },
                scrollbar: {
                    el: '.swiper-scrollbar',
                    draggable: true,
                    hide: false,
                },
                lazy: {
                    loadPrevNext: true,
                },
                pagination: {
                    el: '.swiper-pagination',
                    type: 'fraction',
                    renderFraction: function (currentClass, totalClass) {
                        return '<span class="' + currentClass + '"></span>' +
                            '<span class="swiper-pagination-separator"></span>' +
                            '<span class="' + totalClass + '"></span>';
                    }
                }
            });

            // Mousewheel Control
            if (swiperMousewheel) {
                setMousewheelControll(smallCarousel, smallCarouselSwiperSlider);
            }

            // Navigation Control
            if (swiperNavigation) {
                setSwiperSliderNavigation(smallCarousel, smallCarouselSwiperSlider);
                setStyleForButtonPrevNext(smallCarousel, smallCarouselSwiperSlider);
            }

            // Scrollbar
            if (swiperScrollbar) {
                $('.swiper-scrollbar').addClass('is-visible');
                $('.swiper-container').addClass('swiper-slider-scrollbar-active');
            } else {
                $('.swiper-scrollbar').removeClass('is-visible');
            }

            // Pagination
            if (swiperPagination) {
                $('.swiper-pagination').addClass('is-visible');
            } else {
                $('.swiper-pagination').removeClass('is-visible');
            }

            // Drag Button
            setStyleForDragButton(smallCarousel, smallCarouselSwiperSlider, swiperNavigation);

            // Play Video in Active Slide
            playVideoInActiveSlide();
            smallCarouselSwiperSlider.on('slideChangeTransitionEnd', function () {
                playVideoInActiveSlide();
            });

            // Update Scrollbar Size
            smallCarouselSwiperSlider.scrollbar.updateSize();
        }
    }


    /* Swiper Large Carousel */
    function largeCarouselInit() {
        if ($('.large-carousel').length) {

            // Set Swiper Variables
            var largeCarousel = $('.large-carousel'),
                swiperMousewheel = largeCarousel.data('swiper-mousewheel'),
                swiperNavigation = largeCarousel.data('swiper-navigation'),
                swiperPagination = largeCarousel.data('swiper-pagination'),
                swiperOneSlideVisibility = largeCarousel.data('swiper-one-slide-visibility'),
                swiperScrollbar = largeCarousel.data('swiper-scrollbar'),
                swiperSpeed = largeCarousel.data('swiper-speed'),
                swiperAutoplay = largeCarousel.data('swiper-autoplay') ? {delay: largeCarousel.data('swiper-autoplay')} : largeCarousel.data('swiper-autoplay');

            if (swiperOneSlideVisibility) {
                largeCarousel.addClass('swiper-one-slide-visibility');
            }

            // Set Swiper Slider
            var largeCarouselSwiperSlider = new Swiper('.large-carousel', {
                speed: swiperSpeed,
                autoplay: swiperAutoplay,
                grabCursor: true,
                centeredSlides: true,
                slidesPerView: 1,
                breakpoints: {
                    768: {
                        slidesPerView: 1,
                        spaceBetween: 30,
                    },
                    1380: {
                        slidesPerView: 1,
                        spaceBetween: 60,
                    },
                    2500: {
                        slidesPerView: 2,
                        spaceBetween: 90,
                    }
                },
                scrollbar: {
                    el: '.swiper-scrollbar',
                    draggable: true,
                    hide: false,
                },
                lazy: {
                    loadPrevNext: true,
                },
                pagination: {
                    el: '.swiper-pagination',
                    type: 'fraction',
                    renderFraction: function (currentClass, totalClass) {
                        return '<span class="' + currentClass + '"></span>' +
                            '<span class="swiper-pagination-separator"></span>' +
                            '<span class="' + totalClass + '"></span>';
                    }
                }
            });

            // Mousewheel Control
            if (swiperMousewheel) {
                setMousewheelControll(largeCarousel, largeCarouselSwiperSlider);
            }

            // Navigation Control
            if (swiperNavigation) {
                setSwiperSliderNavigation(largeCarousel, largeCarouselSwiperSlider);
                setStyleForButtonPrevNext(largeCarousel, largeCarouselSwiperSlider);
            }

            // Scrollbar
            if (swiperScrollbar) {
                $('.swiper-scrollbar').addClass('is-visible');
                $('.swiper-container').addClass('swiper-slider-scrollbar-active');
            } else {
                $('.swiper-slider-scrollbar').removeClass('is-visible');
            }

            // Pagination
            if (swiperPagination) {
                $('.swiper-pagination').addClass('is-visible');
            } else {
                $('.swiper-pagination').removeClass('is-visible');
            }

            // Drag Button
            setStyleForDragButton(largeCarousel, largeCarouselSwiperSlider, swiperNavigation);

            // Play Video in Active Slide
            playVideoInActiveSlide();
            largeCarouselSwiperSlider.on('slideChangeTransitionEnd', function () {
                playVideoInActiveSlide();
            });

            // Update Scrollbar Size
            largeCarouselSwiperSlider.scrollbar.updateSize();
        }
    }


    /* Testimonial Carousel */
    function testimonialCarouselInit() {
        if ($('.testimonial-carousel').length) {

            // Set Swiper Variables
            var testimonialCarousel = $('.testimonial-carousel'),
                swiperNavigation = testimonialCarousel.data('swiper-navigation'),
                swiperPagination = testimonialCarousel.data('swiper-pagination'),
                swiperLoop = testimonialCarousel.data('swiper-loop'),
                swiperSpeed = testimonialCarousel.data('swiper-speed'),
                swiperAutoplay = testimonialCarousel.data('swiper-autoplay') ? {delay: testimonialCarousel.data('swiper-autoplay')} : testimonialCarousel.data('swiper-autoplay');

            // Set Swiper Slider
            var testimonialSwiperCarousel = new Swiper('.testimonial-carousel', {
                loop: swiperLoop,
                speed: swiperSpeed,
                autoplay: swiperAutoplay,
                autoHeight: true,
                lazy: {
                    loadPrevNext: true,
                },
                pagination: {
                    el: '.testimonial-carousel-pagination',
                    clickable: true,
                }
            });

            // Navigation Control
            if (swiperNavigation) {
                setSwiperSliderNavigation(testimonialCarousel, testimonialSwiperCarousel);
                setStyleForButtonPrevNext(testimonialCarousel, testimonialSwiperCarousel);
            }

            // Pagination
            if (swiperPagination) {
                $('.testimonial-carousel-pagination').addClass('is-visible');
            } else {
                $('.testimonial-carousel-pagination').removeClass('is-visible');
            }

            // Drag Button
            setStyleForDragButton(testimonialCarousel, testimonialSwiperCarousel, swiperNavigation);

            $(window).on('resize', function () {
                setTimeout(function () {
                    testimonialSwiperCarousel.updateAutoHeight(swiperSpeed);
                }, 1000);
            });

            $(window).on('orientationchange', function () {
                setTimeout(function () {
                    testimonialSwiperCarousel.updateAutoHeight(swiperSpeed);
                }, 1000);
            });

        }
    }


    /* Coming Soon */
    var IDInterval;

    function comingSoonInit() {
        if ($('.coming-soon-time').length) {
            var comingSoonTime = $('.coming-soon-timer').data('coming-soon-time');

            // Set the date we're counting down to
            var countDownDate = new Date(comingSoonTime).getTime();

            // Update the count down every 1 second
            IDInterval = setInterval(function () {

                // Get todays date and time
                var now = new Date().getTime();

                // Find the distance between now an the count down date
                var distance = countDownDate - now;

                // Time calculations for days, hours, minutes and seconds
                var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);

                // Display the result in an element
                function timerInMobileDivase() {
                    if (jQuery.browser.mobile) {
                        $('.time-item').addClass('is-hidden');

                        if (days > 0) {
                            $('#coming-soon-days').parent('.time-item').removeClass('is-hidden');
                        } else if (hours > 0) {
                            $('#coming-soon-hours').parent('.time-item').removeClass('is-hidden');
                        } else if (minutes > 0) {
                            $('#coming-soon-minutes').parent('.time-item').removeClass('is-hidden');
                        } else {
                            $('#coming-soon-seconds').parent('.time-item').removeClass('is-hidden');
                        }
                    }
                }

                $('#coming-soon-days').text(days);
                $('#coming-soon-hours').text(hours);
                $('#coming-soon-minutes').text(minutes);
                $('#coming-soon-seconds').text(seconds);

                timerInMobileDivase();

                // If the count down is finished, write some text
                if (distance < 0) {
                    clearInterval(IDInterval);
                    timerInMobileDivase();
                    $('.coming-soon-timer').addClass('is-end');
                    $('.event-time').addClass('is-active');
                }
            }, 1000);
        }
    }

    function destroyComingSoon() {
        if ($('.coming-soon-time').length) {
            clearInterval(IDInterval);
        }
    }


    /* Play Video on Hover */
    function videoPlayOnHoverInit() {
        if ($('.albums, .gallery').length) {
            $('.albums, .gallery').on('mouseover mouseenter', '.album-item, .gallery-item', function () {
                if ($(this).find('.video-background').length) {
                    $(this).find('.video-background').get(0).play();
                }
            });

            $('.albums, .gallery').on('mouseout mouseleave', '.album-item, .gallery-item', function () {
                if ($(this).find('.video-background').length) {
                    $(this).find('.video-background').get(0).pause();
                }
            });
        }
    }


    /* Grid Random Layout */
    function gridRandomLayoutInit() {
        if ($('.grid-random').length) {
            var maxItem = 0,
                randomizerResult = 1,
                layoutType = $('.grid-random').data('layout-type'),
                randomizerResultLayoutType = function () {
                    randomizerResult = Math.floor((Math.random() * 5) + 1);
                    $('.grid-random').addClass('layout-' + layoutType + '-' + randomizerResult);
                };

            randomizerResultLayoutType();

            if (layoutType === 'lg') {
                maxItem = 5;
            }

            if (layoutType === 'md') {
                maxItem = 7;
            }

            if (layoutType === 'sm') {
                maxItem = 10;
            }

            for (var i = 0; i < maxItem; i++) {
                var lengthGalleryItem = $('.grid-random-wrap .gallery-item:not(.select-gallery-item)').length,
                    randomizerResultItem = Math.floor((Math.random() * lengthGalleryItem) + 0);

                $('.grid-random-wrap .gallery-item:not(.select-gallery-item)').eq(randomizerResultItem).addClass('select-gallery-item').addClass('random-gallery-item-' + (i + 1));

                setTimeout(function () {
                    $('.grid-random-wrap .select-gallery-item').addClass('is-animate-item');
                }, 100)
            }
        }
    }

    $(document).on('click', '.grid-random', function (e) {
        if (e.target.classList.contains('grid-random-wrap')) {
            $('section[class*="layout"]').removeClass(function (index, css) {
                return (css.match(/(^|\s)layout\S+/g) || []).join(' ');
            });
            $('div[class*="select"]').removeClass(function (index, css) {
                return (css.match(/(^|\s)select\S+/g) || []).join(' ');
            });
            $('div[class*="random"]').removeClass(function (index, css) {
                return (css.match(/(^|\s)random\S+/g) || []).join(' ');
            });
            $('.gallery-item').removeClass('is-animate-item');
            gridRandomLayoutInit();
        }
    });


    /* Masonry Layout */
    function masonryLayoutInit() {
        if ($('.masonry').length) {
            $('.masonry-container').masonry({
                itemSelector: '.masonry-item',
                horizontalOrder: true,
                percentPosition: true
            });

            $('.masonry-container').imagesLoaded().progress(function () {
                setTimeout(function () {
                    $('.masonry-container').masonry('layout');
                }, 1000);
            });

            $(window).on('resize', function () {
                setTimeout(function () {
                    $('.masonry-container').masonry('layout');
                }, 1000);
            });

            $(window).on('orientationchange', function () {
                setTimeout(function () {
                    $('.masonry-container').masonry('layout');
                }, 1000);
            });
        }
    }

    /* Filtering Gallery */
    function filteringGalleryInit() {
        if ($('.gallery.filtering').length) {
            var thisFilterName = $('.filter-nav').data('set-filter') ? $('.filter-nav').data('set-filter') : 'all';

            var filteringCategory = function (name) {

                $('.filter-container .filter-item').each(function () {
                    var thisFilterCategoryName = $(this).data('category');

                    if ('all' === name || thisFilterCategoryName === name) {
                        $(this).addClass('is-active');
                        gsap.to($(this), {scale: 1, autoAlpha: 1, duration: .4, display: 'block'});
                    } else {
                        $(this).removeClass('is-active');
                        gsap.to($(this), {scale: 0, autoAlpha: 0, duration: .4, display: 'none'});
                    }
                });

            }

            filteringCategory(thisFilterName);

            $('.filter-nav .filter-item').each(function () {
                var thisFilterItemName = $(this).data('filter');

                if (thisFilterName === thisFilterItemName) {
                    $(this).addClass('is-active');
                }
            });

            $('.filter-nav').on('click', '.filter-item', function () {
                $('.filter-item').removeClass('is-active');
                $(this).addClass('is-active');
                thisFilterName = $(this).data('filter');

                filteringCategory(thisFilterName);
            });
        }
    }


    /* Tabs */
    function tabsInit() {
        if ($('.tabs').length) {

            var tabNumber = 0;

            var openTabNumber = function (number) {
                $('.tabs-content .tab-panel').removeClass('is-active');
                $('.tabs-content .tab-panel').eq(number).addClass('is-active');
            }

            openTabNumber(tabNumber);

            $('.tabs-nav .tab-item').eq(tabNumber).addClass('is-active');

            $('.tabs-nav').on('click', '.tab-item', function () {
                $('.tab-item').removeClass('is-active')
                $(this).addClass('is-active');
                tabNumber = $(this).index();
                openTabNumber(tabNumber);
            });

        }
    }


    /* Curriculum List */
    function curriculumListInit() {
        if ($('.curriculum-list').length) {

            $('.curriculum-list').on('click', '.curriculum-item-title', function () {
                $(this).toggleClass('is-active');
                $(this).siblings('.curriculum-sub-list').slideToggle(200);
            });

        }
    }


    /* Lazy Loading Image And Video */
    //delete window.IntersectionObserver; // Fallback Testing
    function lazyLoadingImgAndVideoInit() {
        if ($('[data-lazy-image]').length || $('[data-lazy-background-image]').length || $('[data-lazy-video]').length) {

            var lazyImages = [].slice.call($('[data-lazy-image]')),
                lazyBackgrounds = [].slice.call($('[data-lazy-background-image]')),
                lazyVideos = [].slice.call($('[data-lazy-video]'));

            if ('IntersectionObserver' in window) {
                var lazyImageObserver = new IntersectionObserver(function (entries, observer) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            var lazyImage = entry.target;
                            $(lazyImage).attr('src', $(lazyImage).data('src'));
                            $(lazyImage).removeAttr('data-src');
                            lazyImageObserver.unobserve(lazyImage);
                            masonryLayoutInit();
                        }
                    });
                });

                lazyImages.forEach(function (lazyImage) {
                    lazyImageObserver.observe(lazyImage);
                });

                var lazyBackgroundsObserver = new IntersectionObserver(function (entries, observer) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            var lazyBackground = entry.target;
                            $(lazyBackground).css('background-image', 'url(' + $(lazyBackground).data('url') + ')');
                            $(lazyBackground).removeAttr('data-url');
                            lazyBackgroundsObserver.unobserve(lazyBackground);
                            masonryLayoutInit();
                        }
                    });
                });

                lazyBackgrounds.forEach(function (lazyBackground) {
                    lazyBackgroundsObserver.observe(lazyBackground);
                });

                var lazyVideoObserver = new IntersectionObserver(function (entries, observer) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            var lazyVideo = entry.target;
                            if ($(lazyVideo).find('source').length) {
                                $(lazyVideo).find('source').each(function () {
                                    $(this).attr('src', $(this).data('src'));
                                    $(this).removeAttr('data-src');
                                });
                            }

                            lazyVideo.load();

                            lazyVideoObserver.unobserve(lazyVideo);
                            masonryLayoutInit();
                        }
                    });
                });

                lazyVideos.forEach(function (lazyVideo) {
                    lazyVideoObserver.observe(lazyVideo);
                });
            } else {

                // Fallback
                lazyImages.forEach(function (lazyImage) {
                    $(lazyImage).attr('src', $(lazyImage).data('src'));
                    $(lazyImage).removeAttr('data-src');
                    masonryLayoutInit();
                });

                lazyBackgrounds.forEach(function (lazyBackground) {
                    $(lazyBackground).css('background-image', 'url(' + $(lazyBackground).data('url') + ')');
                    $(lazyBackground).removeAttr('data-url');
                    masonryLayoutInit();
                });

                lazyVideos.forEach(function (lazyVideo) {
                    if ($(lazyVideo).find('source').length) {
                        $(lazyVideo).find('source').each(function () {
                            $(this).attr('src', $(this).data('src'));
                            $(this).removeAttr('data-src');
                        });
                    }
                    lazyVideo.load();
                    masonryLayoutInit();
                });
            }
        }
    }


    /* Image Animation */
    function imageAnimationInit() {
        if ($('.animation-img').length) {
            $('.animation-img').each(function () {
                new ScrollMagic.Scene({
                    triggerElement: this,
                    triggerHook: 0.6
                }).setClassToggle(this, 'is-animate')
                    .reverse(false)
                    .addTo(controller);
            });
        }
    }


    /* Gallery Light Box */
    if (jQuery.browser.mobile) {
        if ($('.play-pause-video-buttons').length) {
            $('.play-pause-video-buttons').addClass('is-mobile');
        }
    }

    function closeLightBox() {
        if ($('.gallery-light-box').hasClass('is-open')) {
            $('.close-light-box-button').addClass('hide-button');
            $('.gallery-light-box-slider .gallery-item.is-active').removeClass('is-animate');

            setTimeout(function () {
                $('html').removeClass('overflow-heading');
                $('#site-content').removeClass('modal-is-open');
                $('.menu-button').removeClass('hide-button');
                $('.main-nav-classic').removeClass('hide-menu');
                $('.gallery-light-box').removeClass('is-open');
                $('.gallery-light-box-slider').empty();
                $('#ball').removeClass('prev-button, next-button');
            }, 500);
        }
    }

    function nextSlide(currentIndex, totalIndex) {
        if ($('.gallery-light-box-slider .gallery-item').length) {
            var nextIndex = currentIndex + 1;
            if ((currentIndex + 1) === totalIndex) {
                nextIndex = 0;
            }
            $('.gallery-light-box-slider .gallery-item').eq(nextIndex).addClass('is-active');
            setTimeout(function () {
                $('.gallery-light-box-slider .gallery-item.is-active').addClass('is-animate');
            }, 100);
        }
    }

    function prevSlide(currentIndex) {
        if ($('.gallery-light-box-slider .gallery-item').length) {
            var prevIndex = currentIndex - 1;
            $('.gallery-light-box-slider .gallery-item').eq(prevIndex).addClass('is-active');
            setTimeout(function () {
                $('.gallery-light-box-slider .gallery-item.is-active').addClass('is-animate');
            }, 100);
        }
    }

    function checkIfVideoReady() {
        var activeVideo = $('.gallery-light-box-slider .gallery-item.is-active').find('.video-background');
        if (activeVideo.length) {
            if (activeVideo.get(0).readyState === 4) {
                activeVideo.next().removeClass('is-hidden');
            } else {
                activeVideo.next().addClass('is-hidden');
            }
        }
    }

    function playPauseVideoInLightBox() {
        $(document).on('click', '.play-button', function () {
            var $thisVideo = $(this).closest('.gallery-img').find('.video-background');
            $thisVideo.get(0).play();
            $(this).addClass('is-hidden');
            $(this).next().removeClass('is-hidden');
        });

        $(document).on('click', '.pause-button', function () {
            var $thisVideo = $(this).closest('.gallery-img').find('.video-background');
            $thisVideo.get(0).pause();
            $(this).addClass('is-hidden');
            $(this).prev().removeClass('is-hidden');
        });
    }

    function galleryLightBoxInit() {

        if ($('.gallery').length) {

            // Open Lite Box
            $('.gallery').on('click', '.gallery-item', function () {
                $('html').addClass('overflow-heading');
                $('#site-content').addClass('modal-is-open');
                $('.main-nav-classic').addClass('hide-menu');
                $('.menu-button').addClass('hide-button');
                $('.gallery-light-box').addClass('is-open');

                // Open Current Image
                var onClickIndex = 0;

                if ($(this).hasClass('select-gallery-item')) {
                    onClickIndex = $(this).index('.select-gallery-item');
                    $('.gallery .gallery-item.select-gallery-item').clone().appendTo('.gallery-light-box-slider');
                } else if ($(this).parent().hasClass('filter-item is-active')) {
                    onClickIndex = $(this).parent().index('.filter-item.is-active') - 1;
                    $('.gallery .filter-container .filter-item.is-active .gallery-item').clone().appendTo('.gallery-light-box-slider');
                } else {
                    onClickIndex = $(this).parent().index();
                    $('.gallery .gallery-item').clone().appendTo('.gallery-light-box-slider');
                }

                $('.gallery-light-box-slider .gallery-item').eq(onClickIndex).addClass('is-active');

                setTimeout(function () {
                    $('.gallery-light-box-slider .gallery-item.is-active').addClass('is-animate');
                    $('.close-light-box-button').removeClass('hide-button');
                }, 300);

                lazyLoadingImgAndVideoInit();
                checkIfVideoReady();
                playPauseVideoInLightBox();

                // Indexing Slider Elements
                var totalIndex = $('.gallery-light-box-slider .gallery-item').length;

                $('#total-item').html(totalIndex);

                var currentIndex = 0,
                    activeIndex = 0,
                    itemDescription = '';

                var updateSlideData = function () {
                    currentIndex = $('.gallery-light-box-slider .gallery-item.is-active').index(),
                        activeIndex = currentIndex + 1;

                    if ($('.gallery-light-box-slider .gallery-item.is-active').find('img').attr('alt')) {
                        itemDescription = $('.gallery-light-box-slider .gallery-item.is-active').find('img').attr('alt');
                    }

                    $('#gallery-item-description').html(itemDescription);
                    $('#current-item').html(activeIndex);
                }

                updateSlideData();

                var removeActiveClassFromInactiveSlide = function () {
                    $('.gallery-light-box-slider .gallery-item').removeClass('is-active is-animate');
                }

                // Lite Box Slider Navigation
                $('.gallery-light-box').on('click', function (e) {
                    if (!e.target.classList.contains('far')) {
                        removeActiveClassFromInactiveSlide();

                        if ($(this).width() / 2 < e.pageX) {
                            nextSlide(currentIndex, totalIndex);
                        } else {
                            prevSlide(currentIndex);
                        }

                        checkIfVideoReady();
                        updateSlideData();
                    }
                });


                var prevX = 0;

                $('.gallery-light-box-slider').on('touchstart', function (e) {
                    prevX = e.originalEvent.touches[0].pageX;
                });

                $('.gallery-light-box-slider').on('touchend', function (e) {

                    var wayX = Math.abs(prevX - e.originalEvent.changedTouches[0].pageX);

                    if (wayX >= 150) {
                        removeActiveClassFromInactiveSlide();

                        // Dragged left
                        if (prevX > e.originalEvent.changedTouches[0].pageX) {
                            nextSlide(currentIndex, totalIndex);
                        }

                        // Dragged right
                        if (prevX < e.originalEvent.changedTouches[0].pageX) {
                            prevSlide(currentIndex);
                        }

                        checkIfVideoReady();
                        updateSlideData();
                    }
                });

                $('.gallery-light-box').on('mousemove', function (e) {
                    if (!e.target.classList.contains('far')) {
                        if ($(this).width() / 2 < e.pageX) {
                            $('#ball').removeClass('prev-button').addClass('next-button');
                        } else {
                            $('#ball').removeClass('next-button').addClass('prev-button');
                        }
                    }
                });
            });

            // Close Light Box
            $('.close-light-box-button').on('click', function () {
                closeLightBox();
            });
        }
    }


    /* Skills Bar */
    function skillsBarInit() {
        if ($('.skill-bar').length) {
            new ScrollMagic.Scene({
                triggerElement: '.skill-bar',
                triggerHook: 0.7
            })
                .on('start', function () {
                    $('.skill-bar').each(function () {
                        var width = $(this).find('.skill-bar-bar').width();
                        if (width < 1) {
                            $(this).find('.skill-bar-bar').animate({
                                width: $(this).data('skill-percent') + '%',
                            }, 2500);
                            var skillPercent = $(this).data('skill-percent');
                            $(this).find('.skill-bar-percent').find('.skill-percent').text(skillPercent);
                            $(this).find('.skill-percent').each(function () {
                                $(this).prop('Counter', 0).animate({
                                    Counter: $(this).text()
                                }, {
                                    duration: 2500,
                                    easing: 'swing',
                                    step: function (now) {
                                        $(this).text(Math.ceil(now));
                                    }
                                });
                            });
                        }
                    });
                })
                .addTo(controller);
        }
    }

    /* Counter */
    function counterInit() {
        if ($('.counter-item').length) {
            new ScrollMagic.Scene({
                triggerElement: '.counter-item',
                triggerHook: 0.7
            })
                .on('start', function () {
                    $('.counter-item').each(function () {
                        var counter = $(this).find('[data-counter-value]');
                        if (counter.text() < 1) {
                            var counterValue = counter.data('counter-value');
                            counter.text(counterValue);
                            counter.each(function () {
                                counter.prop('Counter', 0).animate({
                                    Counter: counter.text()
                                }, {
                                    duration: 2500,
                                    easing: 'swing',
                                    step: function (now) {
                                        counter.text(Math.ceil(now));
                                    }
                                });
                            });
                        }
                    });
                })
                .addTo(controller);
        }
    }


    /* Image Comparison Slider */
    function imageComparisonSliderInit() {
        if ($('.image-comparison-slider').length) {

            var dragging = false,
                resizing = false;

            var imageComparisonSlider = $('.image-comparison-slider');

            var checkLabel = function (container) {
                container.each(function () {
                    var actual = $(this);
                    updateLabel(actual.find('.image-label.left'), actual.find('.resizable-image'), 'left');
                    updateLabel(actual.find('.image-label.right'), actual.find('.resizable-image'), 'right');
                });

                resizing = false;
            }

            var drags = function (dragElement, resizeElement, container, labelContainer, labelResizeElement) {

                var dragWidth = dragElement.outerWidth(),
                    containerOffset,
                    containerWidth,
                    minLeft,
                    maxLeft;

                var setComparisonSliderParameters = function () {
                    containerOffset = container.offset().left;
                    containerWidth = container.outerWidth();
                    minLeft = containerOffset + 10;
                    maxLeft = containerOffset + containerWidth - dragWidth - 10;
                }

                setComparisonSliderParameters();

                $(window).on('resize', function () {
                    setComparisonSliderParameters();
                });

                $(window).on('orientationchange', function () {
                    setComparisonSliderParameters();
                });

                dragElement.on('mousedown touchstart', function (e) {
                    dragElement.addClass('draggable');
                    resizeElement.addClass('resizable');

                    var startPageX;

                    if (e.type === 'touchstart') {
                        startPageX = e.originalEvent.touches[0].pageX;
                    } else {
                        startPageX = e.pageX;
                    }

                    var xPosition = dragElement.offset().left + dragWidth - startPageX;

                    dragElement.parents().on('mousemove touchmove', function (e) {
                        if (!dragging) {
                            dragging = true;
                            if (!window.requestAnimationFrame) {
                                setTimeout(function () {
                                    animateDraggedHandle(e, xPosition, dragWidth, minLeft, maxLeft, containerOffset, containerWidth, resizeElement, labelContainer, labelResizeElement);
                                }, 100);
                            } else {
                                requestAnimationFrame(function () {
                                    animateDraggedHandle(e, xPosition, dragWidth, minLeft, maxLeft, containerOffset, containerWidth, resizeElement, labelContainer, labelResizeElement);
                                });
                            }
                        }
                    }).on('mouseup touchend', function (e) {
                        dragElement.removeClass('draggable');
                        resizeElement.removeClass('resizable');
                    });
                    e.preventDefault();
                }).on('mouseup touchend', function (e) {
                    dragElement.removeClass('draggable');
                    resizeElement.removeClass('resizable');
                });
            }

            var animateDraggedHandle = function (e, xPosition, dragWidth, minLeft, maxLeft, containerOffset, containerWidth, resizeElement, labelContainer, labelResizeElement) {

                var endPageX;

                if (e.type === 'touchmove') {
                    endPageX = e.originalEvent.changedTouches[0].pageX;
                } else {
                    endPageX = e.pageX;
                }

                var leftValue = endPageX + xPosition - dragWidth;

                if (leftValue < minLeft) {
                    leftValue = minLeft;
                } else if (leftValue > maxLeft) {
                    leftValue = maxLeft;
                }

                var widthValue = (leftValue + dragWidth / 2 - containerOffset) * 100 / containerWidth + '%';

                $('.draggable').css('left', widthValue).on("mouseup touchend", function () {
                    $(this).removeClass('draggable');
                    resizeElement.removeClass('resizable');
                });

                $('.resizable').css('width', widthValue);

                updateLabel(labelResizeElement, resizeElement, 'left');
                updateLabel(labelContainer, resizeElement, 'right');
                dragging = false;
            }

            var updateLabel = function (label, resizeElement, position) {
                if (position == 'left') {
                    if (label.offset().left + label.outerWidth() < resizeElement.offset().left + resizeElement.outerWidth()) {
                        label.removeClass('is-hidden');
                    } else {
                        label.addClass('is-hidden');
                    }
                } else {
                    if (label.offset().left > resizeElement.offset().left + resizeElement.outerWidth()) {
                        label.removeClass('is-hidden');
                    } else {
                        label.addClass('is-hidden');
                    }
                }
            }

            imageComparisonSlider.each(function () {
                new ScrollMagic.Scene({
                    triggerElement: this,
                    triggerHook: 0.6
                }).setClassToggle(this, 'is-visible')
                    .reverse(false)
                    .addTo(controller);
            });

            $(window).on('resize', function () {
                if (!resizing) {
                    resizing = true;
                    if (!window.requestAnimationFrame) {
                        setTimeout(function () {
                            checkLabel(imageComparisonSlider);
                        }, 100)
                    } else {
                        requestAnimationFrame(function () {
                            checkLabel(imageComparisonSlider);
                        });
                    }
                }
            });

            imageComparisonSlider.each(function () {
                var actual = $(this);
                drags(actual.find('.slider-handle'), actual.find('.resizable-image'), actual, actual.find('.image-label.right'), actual.find('.image-label.left'));
            });

        }
    }


    /* Work Process */
    function workProcessInit() {
        if ($('.work-process').length) {

            var itemIndex = 0;

            var setDescriptionItem = function (thisWorkProcess, itemIndex) {

                var resizing = true,
                    workProcessList = thisWorkProcess.find('.work-process-list'),
                    workProcessDescription = thisWorkProcess.find('.work-process-description');

                workProcessList.find('.work-process-item').removeClass('is-active').eq(itemIndex).addClass('is-active');

                var processItem = workProcessList.find('.work-process-item'),
                    descriptionItem = workProcessDescription.find('.work-process-description-item'),
                    activeProcessItem = workProcessList.find('.work-process-item.is-active'),
                    activeProcessItemIndex = activeProcessItem.index();

                if ($(window).width() <= 767) {

                    if (resizing) {
                        var cloneDescriptionItem = descriptionItem.eq(activeProcessItemIndex).clone();

                        if (descriptionItem.hasClass('is-active')) {
                            descriptionItem.removeClass('is-active');
                        }

                        if (processItem.find('.work-process-description-item').length) {
                            processItem.find('.work-process-description-item').remove();
                        }

                        cloneDescriptionItem.appendTo(activeProcessItem);
                    }

                    resizing = false;

                }

                if ($(window).width() >= 767) {

                    if (resizing) {
                        if (processItem.find('.work-process-description-item').length) {
                            processItem.find('.work-process-description-item').remove();
                        }

                        if (descriptionItem.hasClass('is-active')) {
                            descriptionItem.removeClass('is-active');
                        }

                        workProcessDescription.find('.work-process-description-item').eq(activeProcessItemIndex).addClass('is-active');
                    }

                    resizing = true;

                }
            }

            var workProcessClick = function (thisWorkProcess) {

                thisWorkProcess.find('.work-process-list').on('click', '.work-process-item', function () {

                    if (!$(this).hasClass('is-active')) {
                        itemIndex = $(this).index();
                        setDescriptionItem(thisWorkProcess, itemIndex);
                    }

                });

            }

            $('.work-process').each(function () {
                var thisWorkProcess = $(this);

                setDescriptionItem(thisWorkProcess, itemIndex);
                workProcessClick(thisWorkProcess);

                $(window).on('resize', function () {
                    setDescriptionItem(thisWorkProcess, itemIndex);
                });

                $(window).on('orientationchange', function () {
                    setDescriptionItem(thisWorkProcess, itemIndex);
                });
            })

        }
    }


    /* Google Map */
    function googleMapInit() {
        if ($('#google-map').length) {
            var map = $('#google-map'),
                mapLatitude = map.data('map-latitude'),
                mapLongitude = map.data('map-longitude'),
                mapZoom = map.data('map-zoom'),
                mapZoomControl = map.data('map-zoom-control'),
                mapTypeControl = map.data('map-type-control'),
                mapStreetViewControl = map.data('map-street-view-control'),
                mapFullScreenControl = map.data('map-full-screen-control'),
                mapScrollWheel = map.data('map-scroll-wheel'),
                mapMarkerIcon = map.data('map-marker-icon'),
                mapMarkerTitle = map.data('map-marker-title');

            var googleMap = new google.maps.Map(document.getElementById('google-map'), {
                center: {lat: mapLatitude, lng: mapLongitude},
                zoom: mapZoom,
                zoomControl: mapZoomControl,
                mapTypeControl: mapTypeControl,
                streetViewControl: mapStreetViewControl,
                fullscreenControl: mapFullScreenControl,
                scrollwheel: mapScrollWheel,
                gestureHandling: 'cooperative',
                styles: [
                    {
                        "featureType": "all",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#202c3e"
                            }
                        ]
                    },
                    {
                        "featureType": "all",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "gamma": 0.01
                            },
                            {
                                "lightness": 20
                            },
                            {
                                "weight": "1.39"
                            },
                            {
                                "color": "#ffffff"
                            }
                        ]
                    },
                    {
                        "featureType": "all",
                        "elementType": "labels.text.stroke",
                        "stylers": [
                            {
                                "weight": "0.96"
                            },
                            {
                                "saturation": "9"
                            },
                            {
                                "visibility": "on"
                            },
                            {
                                "color": "#000000"
                            }
                        ]
                    },
                    {
                        "featureType": "all",
                        "elementType": "labels.icon",
                        "stylers": [
                            {
                                "visibility": "off"
                            }
                        ]
                    },
                    {
                        "featureType": "landscape",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "lightness": 30
                            },
                            {
                                "saturation": "9"
                            },
                            {
                                "color": "#29446b"
                            }
                        ]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "saturation": 20
                            }
                        ]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "lightness": 20
                            },
                            {
                                "saturation": -20
                            }
                        ]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "lightness": 10
                            },
                            {
                                "saturation": -30
                            }
                        ]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry.fill",
                        "stylers": [
                            {
                                "color": "#193a55"
                            }
                        ]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry.stroke",
                        "stylers": [
                            {
                                "saturation": 25
                            },
                            {
                                "lightness": 25
                            },
                            {
                                "weight": "0.01"
                            }
                        ]
                    },
                    {
                        "featureType": "water",
                        "elementType": "all",
                        "stylers": [
                            {
                                "lightness": -20
                            }
                        ]
                    }
                ]
            });

            var marker = new google.maps.Marker({
                position: {lat: mapLatitude, lng: mapLongitude},
                map: googleMap,
                icon: mapMarkerIcon,
                title: mapMarkerTitle
            });

            var infoWindowTitle = map.data('map-info-window-title'),
                infoWindowText = map.data('map-info-window-text'),
                infoWindowContent = '<div class="info-window-content">' +
                    '<h4>' + infoWindowTitle + '</h4>' +
                    '<p>' + infoWindowText + '</p>' +
                    '</div>';

            var infoWindow = new google.maps.InfoWindow({
                content: infoWindowContent,
                maxWidth: 300
            });

            marker.addListener('click', function () {
                infoWindow.open(googleMap, marker);
            });
        }
    }


    /* Interactive Form */
    function interactiveFormInit() {
        if ($('.interactive-form').length) {
            $('.interactive-form .input-item').on('blur', function () {
                if (this.value) {
                    $(this).parent().addClass('input-label-up');
                } else {
                    $(this).parent().removeClass('input-label-up');
                }
            });

            $('.interactive-form .input-item').on('focus', function () {
                $(this).parent().addClass('input-focus');
            });

            $('.interactive-form .input-item').on('focusout', function () {
                $(this).parent().removeClass('input-focus');
            });

            $('.interactive-form .input-item').on('input', function () {
                if ($(this)[0].checkValidity()) {
                    $(this).parent().addClass('input-valid');
                } else {
                    $(this).parent().removeClass('input-valid');
                }
                if (!this.value) {
                    $(this).parent().removeClass('input-valid');
                }
            });
        }
    }


    /* AJAX Contact Form */
    function ajaxContactFormInit() {
        if ($('.ajax-contact-form').length) {

            var ajaxContactFormSuccessError = function (selector, th) {
                selector.fadeIn().css('display', 'inline-block');

                setTimeout(function () {
                    th.trigger('reset');
                    $('.input-item-box').removeClass('input-label-up input-focus input-valid');
                }, 1000);

                setTimeout(function () {
                    selector.fadeOut();
                }, 4000);
            };

            // Email Ajax Send
            $('.ajax-contact-form').submit(function () {
                var th = $(this);
                $.ajax({
                    type: 'POST',
                    url: 'mail.php',
                    data: th.serialize(),

                    // Success Function
                    success: function (data) {
                        if (data === '1') {
                            var selector = $('.success-message');
                            ajaxContactFormSuccessError(selector, th);
                        } else {
                            var selector = $('.error-message');
                            ajaxContactFormSuccessError(selector, th);
                        }
                    },

                    // Error Function
                    error: function () {
                        var selector = $('.error-message');
                        ajaxContactFormSuccessError(selector, th);
                    }
                });
                return false;
            });
        }
    }


    /* Video Player */
    function videoPlayerInit() {
        if ($('.video-player').length) {
            $('.video-player').each(function () {
                new Plyr(this);
            });
            $('.plyr').addClass('link')
        }
    }


    /* Scroll To Top Page */
    function scrollToTopPageInit() {
        $('html, body').animate({
            scrollTop: $('#site-content').offset().top,
        }, 0);
    }


    /* Class to Scrollable Page */
    function classToScrollablePageInit() {

        var setClassToScrollablePage = function () {
            var screenHeight = $(window).height(),
                fullscreenHeight = $('.fullscreen').outerHeight(),
                pageHeight = $('#site-content').outerHeight();

            if (screenHeight < pageHeight && fullscreenHeight !== pageHeight) {
                $('#site-content').addClass('is-scrollable-page');
            } else {
                $('#site-content').removeClass('is-scrollable-page');
            }
        }

        setTimeout(function () {
            setClassToScrollablePage();
        }, 500);

        $(window).on('resize', function () {
            setClassToScrollablePage();
        });

        $(window).on('orientationchange', function () {
            setClassToScrollablePage();
        });

    }


    /* Touchscreen Script */
    function touchstartInit() {
        $('*').on('touchstart', function () {
            $(this).trigger('hover');
        }).on('touchend', function () {
            $(this).trigger('hover');
        });
    }


    /* Init App Components */
    function initAppComponents() {
        fullScreenMenuInit();
        scrollFirstScreenInit();
        fullScreenSliderInit();
        splitSliderInit();
        smallCarouselInit();
        largeCarouselInit();
        testimonialCarouselInit();
        comingSoonInit();
        videoPlayOnHoverInit();
        gridRandomLayoutInit();
        masonryLayoutInit();
        filteringGalleryInit();
        tabsInit();
        curriculumListInit();
        lazyLoadingImgAndVideoInit();
        imageAnimationInit();
        galleryLightBoxInit();
        skillsBarInit();
        counterInit();
        imageComparisonSliderInit();
        workProcessInit();
        googleMapInit();
        interactiveFormInit();
        ajaxContactFormInit();
        videoPlayerInit();
        scrollToTopPageInit();
        classToScrollablePageInit();
        touchstartInit();
    }

    initAppComponents();


    /* Set Current Year in Copyright */
    $('#copyright-year').text((new Date).getFullYear());

});