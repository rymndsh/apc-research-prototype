<?php

namespace App\Controllers;

use App\Models\UserModel;

class UserController extends BaseController
{
    public function index()
    {
        $userModel = new UserModel();
        $keyword = $this->request->getGet('search');
        
        if ($keyword) {
            $data['users'] = $userModel->searchUsers($keyword);
            $data['search_term'] = $keyword;
        } else {
            $data['users'] = $userModel->findAll();
            $data['search_term'] = '';
        }
        
        return view('user_list', $data);
    }

    public function delete($id)
    {
        $userModel = new UserModel();
        
        // ❌ VULNERABLE
        $userModel->delete($id);
        
        return redirect()->to('/users')->with('message', 'User berhasil dihapus');
    }
}
