var page_stack = new Array();
var oebps_dir = '';
var opf_file = '';
var ncx_file = '';
var abs_container_bottom = null;
var cntr = 0;

function process_content() {
    $('#content p').css('color', 'white');

    // This won't be accurate until the content is first loaded
    abs_container_bottom = $('#book').height() + $('#book').offset().top;

    var target_height = null;
    var para_offset = null;
    var obscured_para = null;
    var last_unobscured_para = null;

    // Find the paragraph that's below the bounding box
    $('#content p:visible').each(function() {
        var top = parseInt($(this).offset().top);
        para_offset = parseInt(top + $(this).height());
        var line_height = parseInt($(this).css('line-height').replace('px', ''));

        if (para_offset > abs_container_bottom) {
            var top_with_padding = top + (line_height);
            if (top_with_padding > abs_container_bottom) {
                // We went too far; this paragraph starts below the fold.
                // This means the previous paragraph broke acceptably, so just
				// return
                return false;
            }
            obscured_para = $(this);
            var letter_width = obscured_para.css('font-size').replace('px', '');
            var para_width = obscured_para.css('width').replace('px', '');
            target_height = abs_container_bottom - line_height;
            return false;
        }
        last_unobscured_para = $(this);

    });
   
    /*
	 * Given a paragraph that needs to be broken, find the minimum displayable
	 * text and push the remaining text to a new paragraph. This could be
	 * improved by accelerating quickly when the disparity between the current
	 * height and target height are great. Also investigate methods to preserve
	 * the DOM integrity of the original by wrapping the overflow into a hidden
	 * span rather than by segmenting it into a new paragraph.
	 */

    if (obscured_para != null && obscured_para.html() != '') {
        text_overflow = new Array();

        while (para_offset > target_height) {
	    t = obscured_para.html();
	    index = t.length - 1;
            // Jump by word
            while (index > 0 && t.charAt(index) != ' ') {
                index--;
            }
            if (index != 0) {
            	text_overflow.push(t.substr(index + 1, t.length - 1));
            } else {
            	text_overflow.push(t.substr(index, t.length));
            }
            obscured_para.html(t.substr(0, index));
            if (index == 0) {
                break;
            }

            para_offset = parseInt(obscured_para.position().top + obscured_para.height());
        }
        // Put the overflow text into a new paragraph after the last one
	
        obscured_para.after($('<p/>').html(text_overflow.reverse().join(' ')));

        // Hide all the remaining paragraphs
        obscured_para.nextAll('p').hide();

    }
    var status = new Object();
    status.top = $($('#content p:visible')[0]);
    if (obscured_para != null) {
        status.bottom = obscured_para;
    } else {
        status.bottom = last_unobscured_para;
        // Are there any more paragraphs? If so, hide them
        if (last_unobscured_para) {
            last_unobscured_para.nextAll('p').hide();
        }
    }
    page_stack.push(status);
    $('#content p').css('color', 'black');

    // Now look at what is visible and figure out what page this is
    var num_chars = 0;
    $('#content p:visible').each(function() {
        num_chars += $(this).text().length;
    });

    var num_chars_invisible = 0;
    $('#content p:hidden').each(function() {
        num_chars_invisible += $(this).text().length;
    });

    var num_chars_before = 0;
    status.top.prevAll('p').each(function() {
        num_chars_before += $(this).text().length;
    });

    var invisible = 500 / num_chars_invisible;
    var all = num_chars_invisible + num_chars;
    var percent = num_chars_before / all;
    if (num_chars_invisible == num_chars_before) {
        percent = 1;
    }
    var width = 500 * percent;
    $('#remaining').css('width', width + 'px');
}

function fade_content(content) {
    content.attr('class', 'faded');
}

function load_content() {
	page = $(this).attr('href');
    // Unselect other sections
    $('.selected').attr('class', 'unselected');
    $(this).attr('class', 'selected');
    
    //reset page counter and assign pg count
    cntr = 0;
    
    $('#content').load(page, null, process_content);
    return false;
}

function next() {
    logPageView();
    var top = page_stack[page_stack.length - 1].bottom;
    if (top) {
        top.prevAll('p').hide();
        top.hide();
        if (top.nextAll('p').length == 0) {
            return next_chapter();
        }
        top.nextAll('p').show();
    } else {
        return next_chapter();
    }
    process_content();
}

function previous() {
    /*
	 * If we have no pages to go back to, call the previous chapter function
	 * instead. This isn't really what the reader probably means -- they want to
	 * turn back to the previous _page_ before the beginning of that chapter,
	 * but we could only potentially do that if we had visited the page already
	 * and had it in the stack.
	 */
    var status = page_stack.pop();
    if (status == null) {
        return process_content();
    }
    if (status.top.prev('p').length == 0) {
        return previous_chapter();
    }
    status.top.hide();
    status = page_stack.pop();
    status.bottom.hide();
    status.top.show();
    status.top.nextAll('p:hidden').show();
    process_content();
}

function next_chapter() {
	// Simulate a click event on the next chapter after the selected one
    $('a.selected').parent().next('li').find('a').click();
    
    // How far is the selected chapter now from the bottom border?
    var selected_position = $('a.selected').position().top;
    var height_of_toc = $('a.selected').height();

    if (selected_position - (height_of_toc * 2) > abs_container_bottom / 2) {
        // Hide the first visible chapter item
        $('#toc a:visible:eq(0)').hide();
    }
    $('#remaining').css('width', '0px');
    
}

function previous_chapter() {
    // Simulate a click event on the next chapter after the selected one
    $('a.selected').parent().prev('li').find('a').click();

    // Have we hidden any chapters that we now want to show?
    $('#toc a:visible:eq(0)').parent().prev('li').find('a').show();

    $('#remaining').css('width', '0px');
}


/* Open the container file to find the resources */

function container() {
    
    try
    {
    	var url = 'http://'+host+'/QPEKA/epub?id='+wid+'&action=0';
    	jQuery.get(url, {}, opf);
    }
    catch (e) {
		alert(e);
	}
    //jQuery.get(opf_file, {}, opf);
}

/* Open the TOC, get the first item and open it */

function toc(f) {

    $(f).find('navPoint').each(function() {
        var s = $('<span/>').text($(this).find('text:first').text());
        //http://'+host+':8080/QPEKA/epub?action=1&section=$(this).find('content').attr('src')
        //var href = epub_dir + '/' + oebps_dir + '/' + $(this).find('content').attr('src');
        var res = '';
        var subpart = '';
        if($(this).find('content').attr('src').indexOf('#') !== -1 )
        {
        	res = $(this).find('content').attr('src').split('#')[0];
        	subpart = $(this).find('content').attr('src').split('#')[1];
        }
        else
        	res = $(this).find('content').attr('src');
        
        var href = 'http://'+host+'/QPEKA/epub?id='+wid+'&action=1&res='+res+'&subpart='+subpart;
        var a = $('<a/>').attr('href',href);
        // If 's' has a parent navPoint, indent it
        if ($(this).parent()[0].tagName.toLowerCase() == 'navpoint') {
            s.addClass('indent');
        }
        s.appendTo(a);
        a.appendTo($('<li/>').appendTo('#toc'));
    });

    // Click on the desired first item link
    $('#toc a:eq(0)').click();

} /* Open the OPF file and read some useful metadata from it */

function opf(f) {
	// Get the document title
    // Depending on the browser, namespaces may or may not be handled here
	var title = $(f).find('title').text(); // Safari
    var author = $(f).find('creator').text();
    $('#content-title').html(title + ' by ' + author);
    // Firefox
    if (title == null || title == '') {
        $('#content-title').html($(f).find('dc\\:title').text() + ' by ' + $(f).find('dc\\:creator').text());
    }
    // Get the NCX
    var opf_item_tag = 'opf\\:item';
    if ($(f).find('opf\\:item').length == 0) {
        opf_item_tag = 'item';
    }
    $(f).find(opf_item_tag).each(function() {
        // Cheat and find the first file ending in NCX
        if ($(this).attr('href').indexOf('.ncx') != -1) {
            //ncx_file = epub_dir + '/' + oebps_dir + '/' + $(this).attr('href');
            ncx_file = 'http://'+host+'/QPEKA/epub?id='+wid+'&action=2';
            jQuery.get(ncx_file, {}, toc);
        }
    });

}
jQuery(document).ready(function() {
    //jQuery.get(epub_dir + '/META-INF/container.xml', {}, container);//jhol
	container();
	$('#toc a').live('click', load_content);

    $('#book').resizable({
        alsoResize: '#content',
        stop: function() {
            $('#content p').show();
	    process_content();

        }
    });

    $('html').mousewheel(function(event, delta) {
        if (delta > 0) // up
        previous();
        else if (delta < 0) // down
        next();
        return false; // prevent default
    });

    $(document).bind('keydown', function(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 78) { // 'n'
        	next();
        }
        if (code == 80) { // 'p'
            previous();
        }
        if (code == 74) { // 'j'
            next_chapter();
        }
        if (code == 75) { // 'k'
            previous_chapter();
        }
    });
    
    jQuery.get('http://'+host+'/QPEKA/bookmark?workId='+wid, {}, function(data) {
		alert(JSON.stringify(data));
	});
    
    
});
// added newly
function gotoBM(pg, sec) {
	if(pg != undefined && sec != undefined){
    	setTimeout(function() {
    		$("ol li:nth-child("+(pg+1)+")").find('a').click();
		setTimeout(function() {
			for(var j = 1 ; j <= sec ; j++)
				next();	
		},10);
	},100);
    }
}

function bookmark()
{
	var ch = $('a.selected').parent().next('li').index()-1;
	var sec = cntr;
	
	jQuery.post('http://'+host+'/QPEKA/bookmark?workId='+wid+'&chId='+ch+'&secId='+sec, {}, function() {
		alert('done');
	});
//	setCookie('chapter', $('a.selected').parent().next('li').index()-1, 365);
//	setCookie('index', cntr, 365);
}

function logPageView()
{
	//increment 
	cntr++;
	var visitedtext = $('#content p:visible');
	var visitedHtml = '';
	for(var i = 0; i < visitedtext.length;i++)
		visitedHtml += visitedtext[i].innerHTML;
	//log the page visit
	jQuery.get('http://'+host+'/QPEKA/log?log='+visitedHtml, {}, function() {
	});
	
}

function getCookie(c_name)
{
	var i,x,y,ARRcookies=document.cookie.split(";");
	for (i=0;i<ARRcookies.length;i++)
	{
		x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
		x=x.replace(/^\s+|\s+$/g,"");
		if (x==c_name)
		{
			return unescape(y);
		}
	}
}

function setCookie(c_name,value,exdays)
{
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
}

function checkCookie()
{
	var username=getCookie("username");
	if (username!=null && username!="")
	{
		alert("Welcome again " + username);
	}
	else
	{
		username=prompt("Please enter your name:","");
		if (username!=null && username!="")
	    {
			setCookie("username",username,365);
	    }
	}
}