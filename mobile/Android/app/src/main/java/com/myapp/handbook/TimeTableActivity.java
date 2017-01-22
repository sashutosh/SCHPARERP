package com.myapp.handbook;

import android.app.DatePickerDialog;
import android.content.SharedPreferences;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.preference.PreferenceManager;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.ListView;
import android.widget.TextView;

import com.myapp.handbook.Listeners.TimeTableDbUpdateListener;
import com.myapp.handbook.Tasks.FetchTimeTableAsyncTask;
import com.myapp.handbook.adapter.TimeTableAdapter;
import com.myapp.handbook.controls.DatePickerFragment;
import com.myapp.handbook.data.HandBookDbHelper;
import com.myapp.handbook.domain.BaseTimeTable;
import com.myapp.handbook.domain.RoleProfile;
import com.myapp.handbook.domain.TimeSlots;
import com.myapp.handbook.domain.WeeklyTimeTable;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class TimeTableActivity extends AppCompatActivity implements View.OnClickListener {

    BaseTimeTable profileTimeTable;
    String selectedProfileId;
    RoleProfile selectedProfile;
    ListView timeTableListView;
    View headerView;
    Button datePickerButton;
    Date selectedDate;
    private SharedPreferences sharedPreferences;
    List<RoleProfile> profiles;
    private SQLiteDatabase db;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_time_table);

        Toolbar myChildToolbar =
                (Toolbar) findViewById(R.id.my_toolbar);

        setSupportActionBar(myChildToolbar);

        // Get a support ActionBar corresponding to this toolbar
        ActionBar ab = getSupportActionBar();

        ab.setTitle("Timetable");

        // Enable the Up button
        ab.setDisplayHomeAsUpEnabled(true);

        SQLiteOpenHelper handbookDbHelper = new HandBookDbHelper(this);

        db = handbookDbHelper.getReadableDatabase();

        //headerView =getLayoutInflater().inflate(R.layout.listview_timetable_footer,null);
        timeTableListView = (ListView) findViewById(R.id.timeTableListView);
        //timeTableListView.addHeaderView(headerView);
        timeTableListView.setEmptyView(findViewById(R.id.empty_list_view));

        datePickerButton =(Button)findViewById(R.id.datepickerButton);

        datePickerButton.setOnClickListener(this);

        selectedDate = new Date();

        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);


        //Get the id of teacher or student

        selectedProfileId =HttpConnectionUtil.getSelectedProfileId();
        selectedProfile = RoleProfile.getProfile(HttpConnectionUtil.getProfiles(),selectedProfileId);

        FetchTimeTableAsyncTask.TaskListener uiUpdater = new FetchTimeTableAsyncTask.TaskListener() {
            @Override
            public void onFinished(BaseTimeTable table) {
                SetupView(table);
            }
        };

        FetchTimeTableAsyncTask.TaskListener dbUpdater = new TimeTableDbUpdateListener(db,selectedProfile,sharedPreferences);

        List<FetchTimeTableAsyncTask.TaskListener> listeners = new ArrayList<>();
        listeners.add(uiUpdater);
        listeners.add(dbUpdater);

        if (sharedPreferences.getBoolean(QuickstartPreferences.TIMETABLE_DOWNLOADED+"_"+selectedProfile.getId(), false) == false) {
            new FetchTimeTableAsyncTask(selectedProfile,listeners).execute();
        }
        else
        {
            profileTimeTable = HandBookDbHelper.loadTimeTable(db,selectedProfileId, selectedProfile.getProfileRole());

        }
        SetupView(profileTimeTable);

    }

    /**
     * Called when a view has been clicked.
     *
     * @param v The view that was clicked.
     */
    @Override
    public void onClick(View v) {

        DatePickerFragment dialog = new DatePickerFragment();
        dialog.setDateSetListener(new DatePickerDialog.OnDateSetListener() {
            @Override
            public void onDateSet(DatePicker view, int year, int monthOfYear, int dayOfMonth) {
                selectedDate = new Date(year,monthOfYear,dayOfMonth);
                setButtonText();
                SetupView(profileTimeTable);
            }
        });
        dialog.show(getSupportFragmentManager(),"Select date");

    }

    private void SetupView(BaseTimeTable table) {

        profileTimeTable =table;

        TextView view =(TextView) findViewById(R.id.empty_list_view);
        if(profileTimeTable!=null){

            //setButtonText();
            String dayOfWeek = getDayOfTheWeek();
            List<WeeklyTimeTable> weekly= profileTimeTable.getWeeklyTimeTableList();
            List<TimeSlots> todaysTimeSlot=getTimeSlot(profileTimeTable,dayOfWeek);

            if(todaysTimeSlot!=null) {

                TimeTableAdapter adapter = new TimeTableAdapter(this, R.layout.list_timetable_item, todaysTimeSlot);
                timeTableListView.setAdapter(adapter);
                view.setVisibility(View.INVISIBLE);
            }
            else {

                view.setVisibility(View.VISIBLE);
                view.setText(R.string.timetable_not_found);

            }
        }
        else {
            view.setVisibility(View.VISIBLE);
            view.setText(R.string.timetable_not_downloaded);
        }
    }

    private List<TimeSlots> getTimeSlot(BaseTimeTable profileTimeTable, String dayOfWeek) {
        List<TimeSlots> slots=null;
        for (WeeklyTimeTable table: profileTimeTable.getWeeklyTimeTableList()
             ) {
            if(table.getDayOfWeek().equalsIgnoreCase(dayOfWeek)) {
                slots = table.getTimeSlotsList();
                break;
            }

        }
        return slots;
    }

    private void setButtonText() {

        Date todaysDate= new Date();
        if(compareDate(todaysDate,selectedDate))
            datePickerButton.setText(R.string.today);
        else
        {
            //Make Date String
            String dateString = getDateAsString(selectedDate);
            datePickerButton.setText(dateString);
        }

    }

    private String getDateAsString(Date selectedDate) {
        String dateString = (String) android.text.format.DateFormat.format("dd", selectedDate) + "/" + (String) android.text.format.DateFormat.format("MMM", selectedDate)+"/"+selectedDate.getYear();
        return dateString;
    }

    private boolean compareDate(Date todaysDate, Date otherDate) {

        return (otherDate.getDay()== todaysDate.getDay() && otherDate.getMonth() == todaysDate.getMonth() && otherDate.getYear()== todaysDate.getYear());

    }

    private String getDayOfTheWeek() {
        Calendar calendar = Calendar.getInstance();
        calendar.set(selectedDate.getYear(),selectedDate.getMonth(),selectedDate.getDay());
        //calendar.setFirstDayOfWeek(Calendar.MONDAY);
        String dayLongName = calendar.getDisplayName(Calendar.DAY_OF_WEEK, Calendar.LONG, Locale.ENGLISH);


        return dayLongName;
    }
}
