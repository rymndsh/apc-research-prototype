<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table = 'users';
    protected $primaryKey = 'id';
    protected $allowedFields = ['username', 'email', 'bio'];

    public function searchUsers($keyword)
    {
        $db = \Config\Database::connect();
        
        // ❌ VULNERABLE
        $query = $db->query("SELECT * FROM users WHERE username LIKE '%" . $keyword . "%'");
        
        return $query->getResultArray();
    }
}
