<?php
/*     
    Copyright 2021 OpenBroadcaster, Inc.

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
class Ob2obModule extends OBFModule
{

	public $name = 'OB-2-OB v2.0';
	public $description = 'Transfer media and metadata to another instance of OBServer.';

	public function callbacks()
	{

	}

	public function install()
	{
    $this->db->query('INSERT INTO `users_permissions` (`id`, `name`, `description`, `category`) VALUES (NULL, \'ob2ob\', \'Access OB2OB Module\', \'OB2OB\');');
		return true;
	}

	public function uninstall()
	{
    $this->db->query('DELETE FROM `users_permissions` WHERE category = \'OB2OB\'');
		return true;
	}

}
