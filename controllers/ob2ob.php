<?php
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
class Ob2ob extends OBFController
{

	public function __construct()
	{

		parent::__construct();
		$this->user->require_authenticated();
    $this->user->require_permission('ob2ob');

		$this->models = OBFModels::get_instance();
	}

	public function init()
	{

		$url = trim($this->data('url'));
		$user = trim($this->data('user'));
		$pass = trim($this->data('pass'));

		if($url=='') return array(false,'A URL is required.');
		if($user=='') return array(false,'A username is required.');
		if($pass=='') return array(false,'A password is required.');

		if(strpos($url,'://')===false) $url = 'http://'.$url;
		// if(!preg_match('/api\.php$/',$url)) $url = $url . ($url[strlen($url)-1]=='/' ? '' : '/') . 'api.php'; // not used - must use both api.php and upload.php so just going to ues root.
		if($url[strlen($url)-1]!='/') $url = $url.'/';

		if(substr($url,0,7)!='http://' && substr($url,0,8)!='https://') return array(false,'The URL is invalid.');

		$this->models->api('set_url', ['url' => $url]);
		$this->models->api('set_user', ['user' => $user]);
		$this->models->api('set_pass', ['pass' => $pass]);

		return array(true,'Init complete');

	}

	public function checkLogin()
	{

		$init = $this->init();
		if(!$init[0]) return $init;

		$response = $this->models->api('login');

		if(!empty($response->status)) return array(true,'Success');
		else return array(false,'Invalid API URL, username, or password.');

	}

	public function transfer()
	{

		$init = $this->init();
		if(!$init[0]) return $init;

		$id = trim($this->data('id'));

		$media = $this->models->media('get_by_id', ['id' => $id]);

		if(!$media) return array(false,'Media not found.');

		// to transfer, must own this media or be able to 'download all media'.
		if($media['owner_id']==$this->user->param('id')) $this->user->require_permission('create_own_media or download_all_media');
		else $this->user->require_permission('download all media');

		// determine media location.
		if($media['is_archived']==1) $media_location = OB_MEDIA_ARCHIVE;
		elseif($media['is_approved']==0) $media_location = OB_MEDIA_UPLOADS;
		else $media_location = OB_MEDIA;

		$media_location.='/'.$media['file_location'][0].'/'.$media['file_location'][1].'/';
		$media_file = $media_location.=$media['filename'];

		// Get all local and remote metadata fields, then compare them to see which ones are available and match types
		// on both sides. We only want to transfer compatible data.
		$localMeta = $this->models->mediametadata('get_all');
		$remoteMeta = $this->models->api('call', ['controller' => 'metadata', 'action' => 'media_metadata_fields']);

		if (! $remoteMeta->status) {
			return array(false, 'Failed to get remote metadata fields.');
		}

		$metaValues = [];
		foreach ($remoteMeta->data as $remoteField) {
			$matches = array_filter($localMeta, function($localField) use ($remoteField) {
				if ($localField['name'] === $remoteField->name && $localField['type'] === $remoteField->type) {
					return true;
				}

				return false;
			});

			if (count($matches) > 0) {
				$metaValues[] = 'metadata_' . $remoteField->name;
			}
		}

		// Upload file and save as media item.
		$response = $this->models->api('upload', ['file' => $media_file]);

		if(!empty($response->file_id))
		{
			$item = new stdClass();
			$item->local_id = 0;
			$item->id = '';
			$item->artist = $media['artist'];
			$item->title = $media['title'];
			$item->album = $media['album'];
			$item->year = $media['year'];
			$item->country = $media['country'];
			$item->category_id = $media['category_id'];
			$item->language = $media['language'];
			$item->genre_id = $media['genre_id'];
			$item->comments = $media['comments'];
			$item->is_copyright_owner = $media['is_copyright_owner'];
			$item->is_approved = 0;
			$item->status = $media['status'];
			$item->dynamic_select = $media['dynamic_select'];
			$item->file_id = $response->file_id;
			$item->file_key = $response->file_key;

			foreach ($metaValues as $metaValue) {
				$item->$metaValue = $media[$metaValue];
			}

			$data = new stdClass();
			$data->media = array($item);

			$response = $this->models->api('call', ['controller' => 'media', 'action' => 'save', 'data' => $data]);

			if($response->status)	return array(true,'Success');
		}

		// if($response->msg == 'Media update validation error(s).') $response->msg.=' Genre or Category may be missing on target.';

		$error = $response->data[0][2];
		if($error=='The genre selected is no longer valid.') $error='The media genre is not available on the target.';
		if($error=='The category selected is no longer valid.') $error='The media category is not available on the target.';

		return array(false,$error);
	}

}
