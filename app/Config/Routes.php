<?php

namespace Config;

$routes = Services::routes();

$routes->get('users', 'UserController::index');
$routes->get('users/delete/(:num)', 'UserController::delete/$1');
