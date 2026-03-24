<?php

use App\Http\Controllers\Claims\ClaimController;
use App\Http\Controllers\Clients\ClientController;
use App\Http\Controllers\Commissions\CommissionController;
use App\Http\Controllers\Documents\ClaimDocumentController;
use App\Http\Controllers\Documents\PolicyDocumentController;
use App\Http\Controllers\Payments\PaymentController;
use App\Http\Controllers\Policies\PolicyController;
use App\Http\Controllers\Quotations\QuotationController;
use App\Http\Controllers\Renewals\RenewalController;
use App\Http\Controllers\Reports\ReportsController;
use App\Http\Controllers\Underwriters\UnderwriterController;
use App\Http\Controllers\Users\UserController;
use App\Models\ReportRun;
use App\Services\Reports\ReportsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::get('dashboard', function (Request $request, ReportsService $reports) {
        $metrics = $reports->computeDashboardMetrics($request->user());

        $recentReports = $request->user()->can('reports.view')
            ? ReportRun::query()
                ->orderByDesc('generated_at')
                ->limit(5)
                ->get()
            : collect();

        return inertia('dashboard', [
            'metrics' => $metrics,
            'recentReports' => $recentReports,
            'showReportsSection' => $request->user()->can('reports.view'),
        ]);
    })->name('dashboard');

    Route::middleware('permission:users.manage')->group(function () {
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::get('users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update.patch');
        Route::post('users/{user}/password', [UserController::class, 'resetPassword'])->name('users.password.reset');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    Route::get('clients', [ClientController::class, 'index'])->middleware('permission:clients.view')->name('clients.index');
    Route::get('clients/create', [ClientController::class, 'create'])->middleware('permission:clients.manage')->name('clients.create');
    Route::post('clients', [ClientController::class, 'store'])->middleware('permission:clients.manage')->name('clients.store');
    Route::get('clients/{client}', [ClientController::class, 'show'])->middleware('permission:clients.view')->name('clients.show');
    Route::get('clients/{client}/edit', [ClientController::class, 'edit'])->middleware('permission:clients.manage')->name('clients.edit');
    Route::put('clients/{client}', [ClientController::class, 'update'])->middleware('permission:clients.manage')->name('clients.update');
    Route::delete('clients/{client}', [ClientController::class, 'destroy'])->middleware('permission:clients.manage')->name('clients.destroy');

    Route::get('underwriters', [UnderwriterController::class, 'index'])->middleware('permission:underwriters.view')->name('underwriters.index');
    Route::get('underwriters/create', [UnderwriterController::class, 'create'])->middleware('permission:underwriters.manage')->name('underwriters.create');
    Route::post('underwriters', [UnderwriterController::class, 'store'])->middleware('permission:underwriters.manage')->name('underwriters.store');
    Route::get('underwriters/{underwriter}', [UnderwriterController::class, 'show'])->middleware('permission:underwriters.view')->name('underwriters.show');
    Route::get('underwriters/{underwriter}/edit', [UnderwriterController::class, 'edit'])->middleware('permission:underwriters.manage')->name('underwriters.edit');
    Route::put('underwriters/{underwriter}', [UnderwriterController::class, 'update'])->middleware('permission:underwriters.manage')->name('underwriters.update');
    Route::patch('underwriters/{underwriter}', [UnderwriterController::class, 'update'])->middleware('permission:underwriters.manage')->name('underwriters.update.patch');
    Route::delete('underwriters/{underwriter}', [UnderwriterController::class, 'destroy'])->middleware('permission:underwriters.manage')->name('underwriters.destroy');

    Route::get('quotations', [QuotationController::class, 'index'])->middleware('permission:quotations.view')->name('quotations.index');
    Route::get('quotations/create', [QuotationController::class, 'create'])->middleware('permission:quotations.manage')->name('quotations.create');
    Route::post('quotations', [QuotationController::class, 'store'])->middleware('permission:quotations.manage')->name('quotations.store');
    Route::get('quotations/{quotation}', [QuotationController::class, 'show'])->middleware('permission:quotations.view')->name('quotations.show');
    Route::get('quotations/{quotation}/edit', [QuotationController::class, 'edit'])->middleware('permission:quotations.manage')->name('quotations.edit');
    Route::put('quotations/{quotation}', [QuotationController::class, 'update'])->middleware('permission:quotations.manage')->name('quotations.update');
    Route::patch('quotations/{quotation}', [QuotationController::class, 'update'])->middleware('permission:quotations.manage')->name('quotations.update.patch');
    Route::delete('quotations/{quotation}', [QuotationController::class, 'destroy'])->middleware('permission:quotations.manage')->name('quotations.destroy');

    Route::get('policies', [PolicyController::class, 'index'])->middleware('permission:policies.view')->name('policies.index');
    Route::get('policies/create', [PolicyController::class, 'create'])->middleware('permission:policies.manage')->name('policies.create');
    Route::post('policies', [PolicyController::class, 'store'])->middleware('permission:policies.manage')->name('policies.store');
    Route::get('policies/{policy}', [PolicyController::class, 'show'])->middleware('permission:policies.view')->name('policies.show');
    Route::get('policies/{policy}/edit', [PolicyController::class, 'edit'])->middleware('permission:policies.manage')->name('policies.edit');
    Route::put('policies/{policy}', [PolicyController::class, 'update'])->middleware('permission:policies.manage')->name('policies.update');
    Route::patch('policies/{policy}', [PolicyController::class, 'update'])->middleware('permission:policies.manage')->name('policies.update.patch');
    Route::delete('policies/{policy}', [PolicyController::class, 'destroy'])->middleware('permission:policies.manage')->name('policies.destroy');

    Route::get('payments', [PaymentController::class, 'index'])->middleware('permission:payments.view')->name('payments.index');
    Route::get('payments/create', [PaymentController::class, 'create'])->middleware('permission:payments.manage')->name('payments.create');
    Route::post('payments', [PaymentController::class, 'store'])->middleware('permission:payments.manage')->name('payments.store');
    Route::get('payments/{payment}', [PaymentController::class, 'show'])->middleware('permission:payments.view')->name('payments.show');
    Route::get('payments/{payment}/edit', [PaymentController::class, 'edit'])->middleware('permission:payments.manage')->name('payments.edit');
    Route::put('payments/{payment}', [PaymentController::class, 'update'])->middleware('permission:payments.manage')->name('payments.update');
    Route::patch('payments/{payment}', [PaymentController::class, 'update'])->middleware('permission:payments.manage')->name('payments.update.patch');
    Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])->middleware('permission:payments.manage')->name('payments.destroy');

    Route::get('claims', [ClaimController::class, 'index'])->middleware('permission:claims.view')->name('claims.index');
    Route::get('claims/create', [ClaimController::class, 'create'])->middleware('permission:claims.manage')->name('claims.create');
    Route::post('claims', [ClaimController::class, 'store'])->middleware('permission:claims.manage')->name('claims.store');
    Route::get('claims/{claim}', [ClaimController::class, 'show'])->middleware('permission:claims.view')->name('claims.show');
    Route::get('claims/{claim}/edit', [ClaimController::class, 'edit'])->middleware('permission:claims.manage')->name('claims.edit');
    Route::put('claims/{claim}', [ClaimController::class, 'update'])->middleware('permission:claims.manage')->name('claims.update');
    Route::patch('claims/{claim}', [ClaimController::class, 'update'])->middleware('permission:claims.manage')->name('claims.update.patch');
    Route::delete('claims/{claim}', [ClaimController::class, 'destroy'])->middleware('permission:claims.manage')->name('claims.destroy');

    Route::get('commissions', [CommissionController::class, 'index'])->middleware('permission:commissions.view')->name('commissions.index');
    Route::get('commissions/create', [CommissionController::class, 'create'])->middleware('permission:commissions.manage')->name('commissions.create');
    Route::post('commissions', [CommissionController::class, 'store'])->middleware('permission:commissions.manage')->name('commissions.store');
    Route::get('commissions/{commission}', [CommissionController::class, 'show'])->middleware('permission:commissions.view')->name('commissions.show');
    Route::get('commissions/{commission}/edit', [CommissionController::class, 'edit'])->middleware('permission:commissions.manage')->name('commissions.edit');
    Route::put('commissions/{commission}', [CommissionController::class, 'update'])->middleware('permission:commissions.manage')->name('commissions.update');
    Route::patch('commissions/{commission}', [CommissionController::class, 'update'])->middleware('permission:commissions.manage')->name('commissions.update.patch');
    Route::delete('commissions/{commission}', [CommissionController::class, 'destroy'])->middleware('permission:commissions.manage')->name('commissions.destroy');

    Route::get('renewals', [RenewalController::class, 'index'])->middleware('permission:renewals.view')->name('renewals.index');
    Route::get('renewals/create', [RenewalController::class, 'create'])->middleware('permission:renewals.manage')->name('renewals.create');
    Route::post('renewals', [RenewalController::class, 'store'])->middleware('permission:renewals.manage')->name('renewals.store');
    Route::get('renewals/{renewal}', [RenewalController::class, 'show'])->middleware('permission:renewals.view')->name('renewals.show');
    Route::get('renewals/{renewal}/edit', [RenewalController::class, 'edit'])->middleware('permission:renewals.manage')->name('renewals.edit');
    Route::put('renewals/{renewal}', [RenewalController::class, 'update'])->middleware('permission:renewals.manage')->name('renewals.update');
    Route::patch('renewals/{renewal}', [RenewalController::class, 'update'])->middleware('permission:renewals.manage')->name('renewals.update.patch');
    Route::delete('renewals/{renewal}', [RenewalController::class, 'destroy'])->middleware('permission:renewals.manage')->name('renewals.destroy');

    Route::get('reports/dashboard', [ReportsController::class, 'dashboard'])->middleware('permission:reports.view')->name('reports.dashboard');
    Route::get('reports', [ReportsController::class, 'index'])->middleware('permission:reports.view')->name('reports.index');
    Route::get('reports/create', [ReportsController::class, 'create'])->middleware('permission:reports.manage')->name('reports.create');
    Route::post('reports', [ReportsController::class, 'store'])->middleware('permission:reports.manage')->name('reports.store');
    Route::get('reports/{reportRun}', [ReportsController::class, 'show'])->middleware('permission:reports.view')->name('reports.show');
    Route::get('reports/{reportRun}/edit', [ReportsController::class, 'edit'])->middleware('permission:reports.manage')->name('reports.edit');
    Route::put('reports/{reportRun}', [ReportsController::class, 'update'])->middleware('permission:reports.manage')->name('reports.update');
    Route::patch('reports/{reportRun}', [ReportsController::class, 'update'])->middleware('permission:reports.manage')->name('reports.update.patch');
    Route::delete('reports/{reportRun}', [ReportsController::class, 'destroy'])->middleware('permission:reports.manage')->name('reports.destroy');

    Route::post('policies/{policy}/documents', [PolicyDocumentController::class, 'store'])->middleware('permission:policies.manage')->name('policies.documents.store');
    Route::delete('policies/{policy}/documents/{document}', [PolicyDocumentController::class, 'destroy'])->middleware('permission:policies.manage')->name('policies.documents.destroy');
    Route::post('claims/{claim}/documents', [ClaimDocumentController::class, 'store'])->middleware('permission:claims.manage')->name('claims.documents.store');
    Route::delete('claims/{claim}/documents/{document}', [ClaimDocumentController::class, 'destroy'])->middleware('permission:claims.manage')->name('claims.documents.destroy');
});

require __DIR__.'/settings.php';
