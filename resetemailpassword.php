
<!DOCTYPE html>
<?php 
$DB_HOST="localhost";
$DB_USER="root";
$DB_PASS="mahek1717";
$DB_NAME="db_cargo_ride";
$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

if(isset($_SESSION["login_sess"])) 
{
  header("location:account.php"); 
}
?>
<html>
<head>
<title> Password Reset </title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="../utilities/iconedsoma.png">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css"> 
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="container">
	<div class="row">
		 <div class="col-sm-4">
		</div>
		<div class="col-sm-4">
      <?php
          if(isset($_GET['token']))
          {
            $token= $_GET['token'];

            $fetchresultok = mysqli_query($mysqli, "SELECT email_id FROM tbl_forgot_password_driver WHERE otp='$token'");
            if($res = mysqli_fetch_array($fetchresultok))
            {
              $email= $res['email_id']; 
            }
              if(isset($email) != '' ) {
                $emailtok=$email;
              }
              else 
              { 
                $error[] = 'Link has been expired or something missing ';
                $hide=1;
              }
  


          }

   //form for submit 
    if(isset($_POST['sub_set'])){
       extract($_POST);
            if($password ==''){
                $error[] = 'Please enter the password.';
            }
            if($passwordConfirm ==''){
                $error[] = 'Please confirm the password.';
            }
            if($password != $passwordConfirm){
                $error[] = 'Passwords do not match.';
            }
            if(strlen($password)<5){ // min 
            $error[] = 'The password is 6 characters long.';
        }
         if(strlen($password)>50){ // Max 
            $error[] = 'Password: Max length 50 Characters Not allowed';
        }
        $fetchresultok = mysqli_query($mysqli, "SELECT email_id FROM tbl_forgot_password_driver WHERE otp='$token'");
          if($res = mysqli_fetch_array($fetchresultok))
          {
            $email= $res['email_id']; 
          }
            if(isset($email) != '' ) {
              $emailtok=$email;
            }
            else 
            { 
              $error[] = 'Link has been expired or something missing ';
              $hide=1;
            }

if(!isset($error)){
    $options = array("cost"=>4);
    //$password = password_hash($password,PASSWORD_BCRYPT,$options);
    $password = md5($password);
    $resultresetpass= mysqli_query($mysqli, "UPDATE tbl_user SET password='$password' WHERE email='$emailtok'"); 
    if($resultresetpass) 
    { 
           $success="<div class='successmsg'><span style='font-size:100px;'>&#9989;</span> <br> Your password has been updated successfully.. <br> <a href='login.php' style='color:#fff;'>Login here... </a> </div>";

          $resultdel = mysqli_query($mysqli, "DELETE FROM tbl_forgot_password_driver WHERE otp='$token'");
          $hide=1;
    }
} 
    }
    ?>
    <div class="login_form">
		<form action="" method="POST">
  <div class="form-group">
    <img src="../utilities/icon.png" alt="" style = "padding-top: 25px;padding-bottom: 25px;border-radius:50px;" class="logo img-fluid"> 
    <br>
   <?php 
if(isset($error)){
        foreach($error as $error){
            echo '<div class="errmsg">'.$error.'</div><br>';
        }
    }
    if(isset($success)){
    echo $success;
  }
              ?>
<?php if(!isset($hide)){ ?>
    <label class="label_txt">Password </label>
      <input type="password" name="password" class="form-control" required>
  </div>
   <div class="form-group">
    <label class="label_txt">Confirm Password </label>
      <input type="password" name="passwordConfirm" class="form-control" required  >
  </div>
  <button type="submit" name="sub_set" class="btn btn-primary btn-group-lg form_btn">Reset Password</button>
  <?php } ?>
</form>
</div>
		</div>
		<div class="col-sm-4">
		</div>
	</div>
</div> 
</body>
<script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/js/bootstrap.bundle.min.js"></script>
</html>
