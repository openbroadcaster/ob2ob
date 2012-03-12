var ModuleOb2ob = new function()
{

	this.init = function()
	{
		$('#obmenu-media').append('<li><a href="javascript: ModuleOb2ob.mediaPage();">OB-2-OB</a></li>');
	}
		
	this.mediaPage = function()
	{
		$('#layout_main').html(html.get('modules/ob2ob/ob2ob.html'));
	}

	this.checkLogin = function()
	{

		$('#ob2ob_messagebox').hide();

		post = new Object;
		post.url = $('#ob2ob_url').val();
		post.user = $('#ob2ob_user').val();
		post.pass = $('#ob2ob_pass').val();

		api.post('ob2ob','checkLogin',post, function(response)
		{

			if(response.status) 
			{
				$('#ob2ob_messagebox').text('Login successful. Drag media items to the box below to transfer.').show();
				$('#ob2ob_media').show();

				$('#ob2ob_media_items').droppable({
					drop: function(event, ui) {

						if($(ui.draggable).attr('data-mode')=='media')
						{

							$('.sidebar_search_media_selected').each(function(index,element) { 

								// don't bother adding if we already have it.
								if($('#ob2ob_media_items tr[data-id='+$(element).attr('data-id')+']').length) return;

								// add here.
								$tr = $('<tr></tr>');
								$tr.append('<td class="item_remove"><td class="item_description"></td><td class="item_status">');
								$tr.find('.item_remove').html('<a href="javascript: ModuleOb2ob.removeItem('+$(element).attr('data-id')+');">[x]</a></td>');
								$tr.find('.item_description').text($(element).attr('data-artist')+' - '+$(element).attr('data-title'));
								$tr.find('.item_status').text('pending');

								$('#ob2ob_media_items').append('<tr data-id="'+$(element).attr('data-id')+'">'+$tr.html()+'</tr>');
								// playlist.addedit_insert_item($(element).attr('data-id'),$(element).attr('data-artist')+' - '+$(element).attr('data-title'),$(element).attr('data-duration'),$(element).attr('data-type'));

							});

							// hide our 'drag here' help.
							$('#ob2ob_media_items_help').hide();

							// unselect our media from our sidebar
							sidebar.media_select_none();

						}

					}
				});

			}
			else $('#ob2ob_messagebox').text(response.msg).show();

		});

	}

	this.removeItem = function(id)
	{
		$('#ob2ob_media_items tr[data-id='+id+']').remove();
		if($('#ob2ob_media_items tr[data-id]').length==0) $('#ob2ob_media_items_help').show();
	}

	this.transferQueue = new Array();
	this.transferQueueInterval = null;

	this.transfer = function()
	{

		$('#ob2ob_api_form input').attr('disabled',true);
		$('#ob2ob_verify_login').hide();
		$('#ob2ob_transfer').val('Transferring... (please wait)');
		$('#ob2ob_transfer').attr('disabled',true);

		$('#ob2ob_media_items tr[data-id]').each(function(index,element)
		{
			ModuleOb2ob.transferQueue.push($(element).attr('data-id'));
		});

		this.transferQueueInterval = setInterval(this.transferQueueProcess,1000);

	}

	this.transferQueueProcess = function()
	{

		// if nothing left in queue, then mark as complete.
		if(ModuleOb2ob.transferQueue.length==0 && api.ajax_list.length==0) 
		{
			$('#ob2ob_transfer').val('Transfer Complete.  Reload this page to transfer another batch.');
			clearInterval(ModuleOb2ob.transferQueueInterval);
			return;
		}

		// transfer next item if nothing in ajax queue.
		if(api.ajax_list.length) return false;

		else 
		{

			var item_id = ModuleOb2ob.transferQueue.shift();
			$('#ob2ob_media_items tr[data-id='+item_id+'] td:last-child').text('transferring...');

			var post = new Object();
			post.url = $('#ob2ob_url').val();
			post.user = $('#ob2ob_user').val();
			post.pass = $('#ob2ob_pass').val();
			post.id = item_id;

			api.post('ob2ob','transfer', post, function(response)
			{

				// temp
				$('#ob2ob_media_items tr[data-id='+item_id+'] td:last-child').text(response.msg);
				return;
				
				if(response.status) $('#ob2ob_media_items tr[data-id='+item_id+'] td:last-child').text('success');
				else $('#ob2ob_media_items tr[data-id='+item_id+'] td:last-child').text('error');

			});

		}

	}

}

$(document).ready(function() {

	ModuleOb2ob.init();

});
