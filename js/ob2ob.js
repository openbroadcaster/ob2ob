/*     
    Copyright 2012 OpenBroadcaster, Inc.

    This file is part of OpenBroadcaster Server.

    OpenBroadcaster Server is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    OpenBroadcaster Server is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with OpenBroadcaster Server.  If not, see <http://www.gnu.org/licenses/>.
*/
OBModules.Ob2ob = new function()
{

	this.cachedURL = false;
	this.cachedUser = false;
	this.cachedPass = false;
	
  this.init = function()
  {
    OB.Callbacks.add('ready',0,OBModules.Ob2ob.initMenu);
  }

	this.initMenu = function()
	{
    OB.UI.addSubMenuItem('media','OB-2-OB','ob2ob',OBModules.Ob2ob.mediaPage,20,'ob2ob');
	}
		
	this.mediaPage = function()
	{
		if(OBModules.Ob2ob.transferQueueInterval) clearInterval(OBModules.Ob2ob.transferQueueInterval);
		OB.UI.replaceMain('modules/ob2ob/ob2ob.html');

		if(OBModules.Ob2ob.cachedURL) $('#ob2ob_url').val(OBModules.Ob2ob.cachedURL);
		if(OBModules.Ob2ob.cachedUser) $('#ob2ob_user').val(OBModules.Ob2ob.cachedUser);
		if(OBModules.Ob2ob.cachedPass) $('#ob2ob_pass').val(OBModules.Ob2ob.cachedPass);
	}

	this.checkLogin = function()
	{

		var post = new Object;
		post.url = $('#ob2ob_url').val();
		post.user = $('#ob2ob_user').val();
		post.pass = $('#ob2ob_pass').val();

		OB.API.post('ob2ob','checkLogin',post, function(response)
		{

			if(response.status) 
			{

				OBModules.Ob2ob.cachedURL = $('#ob2ob_url').val();
				OBModules.Ob2ob.cachedUser = $('#ob2ob_user').val();
				OBModules.Ob2ob.cachedPass = $('#ob2ob_pass').val();

				$('#ob2ob_message').obWidget('success','Login successful. Drag media items to the box below to transfer.');
				$('#ob2ob_media').show();

				$('#ob2ob_api_form input').attr('disabled',true);
				$('#ob2ob_verify_login').hide();

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
								$tr.find('.item_remove').html('<a href="javascript: OBModules.Ob2ob.removeItem('+$(element).attr('data-id')+');">x</a></td>');
								$tr.find('.item_description').text($(element).attr('data-artist')+' - '+$(element).attr('data-title'));
								$tr.find('.item_status').text('pending');

								$('#ob2ob_media_items').append('<tr data-id="'+$(element).attr('data-id')+'">'+$tr.html()+'</tr>');
								// playlist.addedit_insert_item($(element).attr('data-id'),$(element).attr('data-artist')+' - '+$(element).attr('data-title'),$(element).attr('data-duration'),$(element).attr('data-type'));

							});

							// hide our 'drag here' help.
							$('#ob2ob_media_items_help').hide();

							// unselect our media from our sidebar
							OB.Sidebar.mediaSelectNone();

						}

					}
				});

			}
			else $('#ob2ob_message').obWidget('error',response.msg);

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

		$('#ob2ob_media_items tr[data-id] td:first-child').css('display','none');
		$('#ob2ob_transfer').val('Transferring... (please wait)');
		$('#ob2ob_transfer').attr('disabled',true);

		$('#ob2ob_media_items tr[data-id]').each(function(index,element)
		{
			OBModules.Ob2ob.transferQueue.push($(element).attr('data-id'));
		});

		OBModules.Ob2ob.transferQueueInterval = setInterval(OBModules.Ob2ob.transferQueueProcess,1000);

	}

	this.transferQueueProcess = function()
	{

		// if nothing left in queue, then mark as complete.
		if(OBModules.Ob2ob.transferQueue.length==0 && OB.API.ajax_list.length==0) 
		{
			$('#ob2ob_transfer_success').show();
			$('#ob2ob_transfer').hide();
			$('#ob2ob_message').obWidget('success','Transfer Complete.  Media will be found under your user with status "unapproved".');
			clearInterval(OBModules.Ob2ob.transferQueueInterval);
			return;
		}

		// transfer next item if nothing in ajax queue.
		if(OB.API.ajax_list.length) return false;

		else 
		{

			var item_id = OBModules.Ob2ob.transferQueue.shift();
			$('#ob2ob_media_items tr[data-id='+item_id+'] td:last-child').text('transferring...');

			var post = new Object();
			post.url = $('#ob2ob_url').val();
			post.user = $('#ob2ob_user').val();
			post.pass = $('#ob2ob_pass').val();
			post.id = item_id;

			OB.API.post('ob2ob','transfer', post, function(response)
			{
				
				if(response.status) $('#ob2ob_media_items tr[data-id='+item_id+'] td:last-child').text('success');
				else $('#ob2ob_media_items tr[data-id='+item_id+'] td:last-child').text(response.msg);

			});

		}

	}

}

